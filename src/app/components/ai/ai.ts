import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../layout/main-layout';
import { ApiService } from '../../services/api.service';
import { ChatMessage } from '../../models/api.models';

@Component({
  selector: 'app-ai',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  template: `
    <app-main-layout pageTitle="AI Assistant" activePage="ai">
      <div class="flex flex-col h-full bg-black text-white">
        <!-- AI Header -->
        <div class="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-[#00FF88]/20 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00FF88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            </div>
            <div>
              <h1 class="font-bold text-lg">Finmate AI</h1>
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse"></span>
                <span class="text-xs text-gray-400">Online</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4" #chatContainer>
          @if (messages.length === 0) {
            <div class="flex justify-start">
              <div class="max-w-[85%] p-4 rounded-2xl bg-gray-800 text-white rounded-tl-none">
                <p class="text-sm leading-relaxed">Hello! I'm your personal financial assistant. How can I help you today? You can ask me about your assets, market trends, or for investment advice.</p>
              </div>
            </div>
          }
          @for (msg of messages; track msg.id) {
            <div [class]="msg.isFromAI ? 'flex justify-start' : 'flex justify-end'">
              <div class="max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed" [class]="msg.isFromAI ? 'bg-gray-800 text-white rounded-tl-none' : 'bg-[#00FF88] text-black rounded-tr-none'">
                {{ msg.content }}
              </div>
            </div>
          }
          @if (sending) {
            <div class="flex justify-start">
              <div class="max-w-[85%] p-4 rounded-2xl bg-gray-800 rounded-tl-none">
                <div class="flex gap-1">
                  <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                  <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Input Area -->
        <div class="p-4 bg-gray-900/50 border-t border-gray-800 space-y-4">
          <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            @for (q of quickQuestions; track q) {
              <button (click)="sendQuickQuestion(q)" class="flex-shrink-0 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-xs text-gray-300 transition-colors border border-gray-700 whitespace-nowrap">
                {{ q }}
              </button>
            }
          </div>
          <div class="flex gap-2">
            <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Ask anything about your finances..." class="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#00FF88]">
            <button (click)="sendMessage()" [disabled]="!newMessage.trim() || sending" class="p-3 bg-[#00FF88] text-black rounded-xl hover:bg-[#00FF88]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>
            </button>
          </div>
        </div>
      </div>
    </app-main-layout>
  `
})
export class AiComponent implements OnInit {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  messages: ChatMessage[] = [];
  quickQuestions: string[] = [];
  newMessage = '';
  sending = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getChatHistory().subscribe(msgs => this.messages = msgs);
    this.api.getQuickQuestions().subscribe(q => this.quickQuestions = q);
  }

  sendMessage() {
    if (!this.newMessage.trim() || this.sending) return;
    const content = this.newMessage;
    this.newMessage = '';
    this.messages.push({ id: crypto.randomUUID(), content, isFromAI: false, createdAt: new Date().toISOString() });
    this.sending = true;
    this.scrollToBottom();

    this.api.sendMessage(content).subscribe({
      next: (response) => {
        this.messages.push(response);
        this.sending = false;
        this.scrollToBottom();
      },
      error: () => {
        this.sending = false;
      }
    });
  }

  sendQuickQuestion(question: string) {
    this.newMessage = question;
    this.sendMessage();
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
