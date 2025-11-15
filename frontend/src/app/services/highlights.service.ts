import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:8000';

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
}
