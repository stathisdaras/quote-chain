import { Component, OnInit } from '@angular/core';
import { HighlightsService, SearchRequest, SearchResult, UploadResponse } from '../../services/highlights.service';

@Component({
  selector: 'app-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.css']
})
export class ToolBarComponent implements OnInit {
  // Upload properties
  selectedFile: File | null = null;
  isUploading = false;
  uploadError: string = '';
  showUploadDialog = false;
  overwriteExisting = false;

  // Search properties
  searchPrompt: string = '';
  tags: string = '';
  isSearching: boolean = false;
  searchResults: SearchResult[] = [];
  searchError: string = '';

  // Highlights list properties
  highlights: SearchResult[] = [];
  isLoadingHighlights = false;
  totalRecords = 0;
  first = 0;
  rows = 10;
  isSearchMode = false;

  constructor(private highlightsService: HighlightsService) { }

  ngOnInit(): void {
    this.loadHighlights();
  }

  loadHighlights(): void {
    this.isLoadingHighlights = true;
    this.isSearchMode = false;
    
    this.highlightsService.getAllHighlights(this.first, this.rows).subscribe({
      next: (response) => {
        this.highlights = response.highlights;
        this.totalRecords = response.total;
        this.isLoadingHighlights = false;
      },
      error: (error) => {
        console.error('Error loading highlights:', error);
        this.highlights = [];
        this.totalRecords = 0;
        this.isLoadingHighlights = false;
      }
    });
  }

  onPageChange(event: any): void {
    // Only handle server-side pagination (when not in search mode)
    if (!this.isSearchMode) {
      this.first = event.first;
      this.rows = event.rows;
      this.loadHighlights();
    }
  }


  onUploadButtonClick(): void {
    // Open the upload dialog
    this.showUploadDialog = true;
    this.uploadError = '';
    this.selectedFile = null;
    this.overwriteExisting = false;
  }

  onDialogFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadError = '';
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('dialogFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  closeUploadDialog(): void {
    this.showUploadDialog = false;
    this.selectedFile = null;
    this.uploadError = '';
    this.overwriteExisting = false;
    // Reset file input
    const fileInput = document.getElementById('dialogFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Please select a CSV file';
      return;
    }

    if (!this.selectedFile.name.endsWith('.csv')) {
      this.uploadError = 'Please select a CSV file';
      return;
    }

    this.isUploading = true;
    this.uploadError = '';

    // If overwrite is enabled, clear all highlights first
    if (this.overwriteExisting) {
      this.highlightsService.clearHighlights().subscribe({
        next: () => {
          // After clearing, proceed with upload
          this.performUpload();
        },
        error: (error) => {
          this.uploadError = error.error?.detail || 'Error clearing existing highlights. Please try again.';
          this.isUploading = false;
        }
      });
    } else {
      // Upload without clearing
      this.performUpload();
    }
  }

  private performUpload(): void {
    if (!this.selectedFile) {
      return;
    }

    this.highlightsService.uploadHighlights(this.selectedFile).subscribe({
      next: (response: UploadResponse) => {
        this.isUploading = false;
        // Close dialog and reset
        this.closeUploadDialog();
        // Reload highlights after upload
        this.first = 0;
        this.loadHighlights();
      },
      error: (error) => {
        this.uploadError = error.error?.detail || 'Error uploading file. Please try again.';
        this.isUploading = false;
      }
    });
  }

  onSearch(): void {
    if (!this.searchPrompt.trim()) {
      this.searchError = 'Please enter a search query';
      return;
    }

    this.isSearching = true;
    this.searchError = '';
    this.searchResults = [];

    const request: SearchRequest = {
      prompt: this.searchPrompt.trim()
    };

    // Parse tags if provided
    if (this.tags.trim()) {
      request.tags = this.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }

    this.highlightsService.searchHighlights(request).subscribe({
      next: (results: SearchResult[]) => {
        this.searchResults = results;
        this.highlights = results;
        this.totalRecords = results.length;
        this.first = 0;
        this.rows = 10; // Reset to default page size
        this.isSearchMode = true;
        this.isSearching = false;
      },
      error: (error) => {
        this.searchError = error.error?.detail || 'Error performing search. Please try again.';
        this.isSearching = false;
      }
    });
  }

  clearSearch(): void {
    this.searchPrompt = '';
    this.tags = '';
    this.searchResults = [];
    this.searchError = '';
    this.first = 0;
    this.isSearchMode = false;
    this.loadHighlights();
  }
}

