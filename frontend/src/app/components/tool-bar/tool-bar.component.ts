import { Component, OnInit } from '@angular/core';
import { HighlightsService, SearchRequest, SearchResult, UploadResponse, RAGChatRequest } from '../../services/highlights.service';
import { ConfirmationService, MessageService } from 'primeng/api';

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

  // RAG properties
  ragEnabled = false;
  chatMessages: Array<{role: 'user' | 'assistant', content: string, timestamp: Date}> = [];
  currentChatInput = '';
  isGeneratingResponse = false;

  constructor(
    private highlightsService: HighlightsService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    if (!this.ragEnabled) {
      this.loadHighlights();
    }
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

    // If RAG mode is enabled, use chat instead of table search
    if (this.ragEnabled) {
      this.performRAGChat();
      return;
    }

    // Regular table search
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

  performRAGChat(): void {
    if (!this.searchPrompt.trim()) {
      return;
    }

    // Add user message to chat
    this.chatMessages.push({
      role: 'user',
      content: this.searchPrompt.trim(),
      timestamp: new Date()
    });

    this.isGeneratingResponse = true;
    this.searchError = '';

    const request: RAGChatRequest = {
      prompt: this.searchPrompt.trim()
    };

    // Parse tags if provided
    if (this.tags.trim()) {
      request.tags = this.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }

    this.highlightsService.ragChat(request).subscribe({
      next: (response) => {
        // Add assistant response to chat
        this.chatMessages.push({
          role: 'assistant',
          content: response.response,
          timestamp: new Date()
        });
        this.isGeneratingResponse = false;
        this.searchPrompt = ''; // Clear input after sending
      },
      error: (error) => {
        this.searchError = error.error?.detail || 'Error generating response. Please try again.';
        this.isGeneratingResponse = false;
        // Remove the user message if there was an error
        if (this.chatMessages.length > 0 && this.chatMessages[this.chatMessages.length - 1].role === 'user') {
          this.chatMessages.pop();
        }
      }
    });
  }

  onRAGToggled(): void {
    // Clear chat when disabling RAG
    if (!this.ragEnabled) {
      this.chatMessages = [];
    }
  }

  clearSearch(): void {
    this.searchPrompt = '';
    this.tags = '';
    this.searchResults = [];
    this.searchError = '';
    this.first = 0;
    this.isSearchMode = false;
    if (this.ragEnabled) {
      this.chatMessages = [];
    } else {
      this.loadHighlights();
    }
  }

  onNukemClick(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to NUKE all highlights? This action cannot be undone!',
      header: '⚠️ NUKE Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Yes, NUKE them all',
      rejectLabel: 'Cancel',
      accept: () => {
        this.nukeHighlights();
      }
    });
  }

  nukeHighlights(): void {
    this.highlightsService.clearHighlights().subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Nuked!',
          detail: 'All highlights have been destroyed.',
          life: 3000
        });
        // Clear search and reload
        this.clearSearch();
        this.first = 0;
        this.loadHighlights();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Nuke Failed',
          detail: error.error?.detail || 'Failed to clear highlights. Please try again.',
          life: 5000
        });
      }
    });
  }
}

