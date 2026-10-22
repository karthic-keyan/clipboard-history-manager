import { HistoryRepository } from '../database/history-repository';
import { DeduplicationService } from './deduplication';
import { readCurrentClipboard } from './reader';
import { ClipboardItem } from '../../shared/types';
import { getImageStorageDir } from '../database/connection';
import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';

export type ClipboardCallback = (item: ClipboardItem) => void;

export class ClipboardMonitor {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private deduplication = new DeduplicationService();
  private callbacks: Set<ClipboardCallback> = new Set();

  constructor(private repository: HistoryRepository) {}

  public getDeduplication(): DeduplicationService {
    return this.deduplication;
  }

  public onNewItem(callback: ClipboardCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  public isMonitoring(): boolean {
    return this.isRunning;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const settings = this.repository.getSettings();
    const interval = Math.max(200, settings.polling_interval || 500);

    // Initial check without triggering callback to prime the lastHash
    const initialRead = readCurrentClipboard('init', {
      saveImages: false, // Don't save image on initial boot prime
      maxImageSizeMb: settings.max_image_size_mb,
      detectSensitive: settings.detect_sensitive_data,
      maskSensitive: settings.mask_passwords_in_preview,
    });
    if (initialRead) {
      this.deduplication.setLastHash(initialRead.contentHash);
    }

    this.timer = setInterval(() => {
      this.poll();
    }, interval);
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public updateInterval(newIntervalMs: number): void {
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  private poll(): void {
    if (!this.isRunning) return;

    try {
      const settings = this.repository.getSettings();
      if (!settings.monitoring_enabled) {
        this.stop();
        return;
      }

      const readResult = readCurrentClipboard('poll', {
        saveImages: settings.save_images,
        maxImageSizeMb: settings.max_image_size_mb,
        detectSensitive: settings.detect_sensitive_data,
        maskSensitive: settings.mask_passwords_in_preview,
      });

      if (!readResult || !readResult.hasContent) {
        return;
      }

      const hash = readResult.contentHash;

      // Unchanged clipboard - return immediately with zero disk writes
      if (this.deduplication.isSameAsLast(hash)) {
        return;
      }

      // Check if this was copied from within our app
      if (this.deduplication.isInternalCopy(hash)) {
        this.deduplication.setLastHash(hash);
        return;
      }

      this.deduplication.setLastHash(hash);

      // Check if user has chosen to ignore sensitive items
      if (settings.ignore_sensitive_content && readResult.isSensitive) {
        return;
      }

      // Check for duplicate in database
      const existing = this.repository.getByHash(hash);
      const now = Date.now();

      if (existing) {
        // Update repeated copy timestamp
        this.repository.updateLastCopied(existing.id, now);
        const updated = this.repository.getById(existing.id);
        if (updated) {
          for (const cb of this.callbacks) {
            cb(updated);
          }
        }
        return;
      }

      // Completely new item: allocate ID and save image to disk if applicable
      const newItemId = crypto.randomUUID();
      let imagePath: string | null = null;
      let content = readResult.content;

      if (readResult.contentType === 'image' && readResult.imageBuffer) {
        const fileName = `${newItemId}.png`;
        imagePath = path.join(getImageStorageDir(), fileName);
        try {
          fs.writeFileSync(imagePath, readResult.imageBuffer);
          content = imagePath;
        } catch (err) {
          console.error('Failed to write image file:', err);
        }
      }

      const newItem: ClipboardItem = {
        id: newItemId,
        content_type: readResult.contentType,
        content,
        preview: readResult.preview,
        html_content: readResult.htmlContent,
        content_hash: hash,
        content_size: readResult.contentSize,
        char_count: readResult.charCount,
        word_count: readResult.wordCount,
        line_count: readResult.lineCount,
        image_path: imagePath,
        image_width: readResult.imageWidth,
        image_height: readResult.imageHeight,
        is_pinned: false,
        is_sensitive: readResult.isSensitive,
        sensitive_type: readResult.sensitiveType,
        source_app: null,
        created_at: now,
        last_copied_at: now,
        copy_count: 1,
      };

      this.repository.create(newItem);

      // Prune excess if over limit
      this.repository.pruneExcess(settings.max_history_items);

      // Notify listeners
      for (const cb of this.callbacks) {
        cb(newItem);
      }
    } catch (err) {
      console.error('Error during clipboard polling:', err);
    }
  }
}
