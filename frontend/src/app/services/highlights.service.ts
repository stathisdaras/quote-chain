import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

// Use '/api' for Docker (proxied by nginx), 'http://localhost:8000' for local development
const API_URL = '/api';

export interface SearchRequest {
  prompt: string;
  limit?: number;
  tags?: string[];
}

export interface SearchResult {
  content: string;
  book_title: string;
  book_author: string;
  tags: string[];
  score: number;
}

export interface UploadResponse {
  message: string;
  count: number;
}

export interface CountResponse {
  count: number;
}

export interface HighlightsResponse {
  highlights: SearchResult[];
  total: number;
  skip: number;
  limit: number;
}

export interface RAGChatRequest {
  prompt: string;
  tags?: string[];
}

export interface RAGChatResponse {
  response: string;
  sources: SearchResult[];
}

@Injectable({
  providedIn: 'root'
})
export class HighlightsService {
  constructor(private http: HttpClient) { }

  uploadHighlights(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${API_URL}/highlights`, formData);
  }

  searchHighlights(request: SearchRequest): Observable<SearchResult[]> {
    return this.http.post<SearchResult[]>(`${API_URL}/search`, request);
  }

  getAllHighlights(skip: number = 0, limit: number = 10): Observable<HighlightsResponse> {
    return this.http.get<HighlightsResponse>(`${API_URL}/highlights?skip=${skip}&limit=${limit}`);
  }

  getHighlightsCount(): Observable<CountResponse> {
    return this.http.get<CountResponse>(`${API_URL}/highlights/count`);
  }

  clearHighlights(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_URL}/highlights/clear`);
  }

  ragChat(request: RAGChatRequest): Observable<RAGChatResponse> {
    return this.http.post<RAGChatResponse>(`${API_URL}/rag/chat`, request);
  }
}
