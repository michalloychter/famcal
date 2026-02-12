import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../core/authService';
import { MessagesService, FamMessage } from '../../core/messagesService';
import { SocketService } from '../../core/socket.service';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
@Component({
	selector: 'app-all-messages-modal',
	standalone: true,
	imports: [CommonModule, FormsModule, TranslateModule],
	templateUrl: './all-messages-modal.component.html',
	styleUrls: ['./all-messages-modal.component.css']
})
export class AllMessagesModalComponent {
	// Scrolls the chat to the bottom
	scrollToBottom(): void {
		setTimeout(() => {
			const container = document.getElementById('messages-container');
			if (container) {
				container.scrollTop = container.scrollHeight;
			}
		}, 0);
	}
	messages: FamMessage[] = [];
	newMessage: string = '';
	loading: boolean = true;
	members: { name: string; color?: string }[] = [];

		constructor(
			public authService: AuthService,
			private messagesService: MessagesService,
			private dialogRef: MatDialogRef<AllMessagesModalComponent>,
			private cdr: ChangeDetectorRef,
			private socketService: SocketService
		) {}

	ngOnInit(): void {
		const currentUser = this.authService.currentUser();
		if (!currentUser?.familyId) return;
		this.members = (currentUser.familyMembers || []).map(m => ({ name: m.name, color: m.color }));
		this.loading = true;
		this.messagesService.getMessages(currentUser.familyId).subscribe({
			next: (msgs: FamMessage[]) => {
				this.messages = msgs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
				this.loading = false;
				this.cdr.markForCheck();
					this.scrollToBottom();
			},
			error: (err: any) => {
				this.loading = false;
				console.error('Failed to load messages', err);
			}
		});

		// Connect to socket and listen for real-time message updates
		this.socketService.connect(currentUser.familyId);
		this.socketService.onMessagesUpdate((msgs: FamMessage[]) => {
			this.messages = msgs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
			this.cdr.markForCheck();
				this.scrollToBottom();
		});
	}

	sendMessage(): void {
		const currentUser = this.authService.currentUser();
		if (!this.newMessage.trim() || !currentUser?.familyId) return;
		const msg: Omit<FamMessage, 'id'> = {
			memberName: currentUser.name || '',
			familyId: currentUser.familyId,
			date: new Date().toISOString(),
			text: this.newMessage.trim()
		};
		this.messagesService.sendMessage(msg).subscribe({
			next: (savedMsg: FamMessage) => {
				this.messages.push(savedMsg);
				this.newMessage = '';
					this.cdr.markForCheck();
					this.scrollToBottom();
			},
			error: (err: any) => {
				alert('Failed to send message. Please try again.');
				console.error('Send message error', err);
			}
		});
	}
}
