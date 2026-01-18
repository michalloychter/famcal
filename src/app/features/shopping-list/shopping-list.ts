
import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShoppingListService } from '../../core/shoppingListService';
import { AuthService } from '../../core/authService';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shopping-list.html',
  styleUrls: ['./shopping-list.css'],
  providers: [ShoppingListService]
})
export class ShoppingListComponent implements OnInit {

  items: string[] = [];
  newItem = '';

  constructor(
    private shoppingListService: ShoppingListService,
    private authService: AuthService
  ) {}

  readonly familyId = computed(() => {
    const user = this.authService.currentUser();
    return user?.familyId ? String(user.familyId) : (user?.id ? String(user.id) : null);
  });

  ngOnInit() {
    const user = this.authService.currentUser();
    console.log("user in ngOnInit", user);
    const familyId = this.familyId();
    console.log("familyid", familyId);
    if (familyId) {
      this.shoppingListService.getShoppingList(familyId).subscribe({
        next: (list) => this.items = list || [],
        error: () => this.items = []
      });
    }
  }

  addItem() {
    const item = this.newItem.trim();
    const familyId = this.familyId();
    if (item && familyId) {
      // Optimistically add to UI
      this.items = [...this.items, item];
      this.newItem = '';
      this.shoppingListService.addProduct(familyId, item).subscribe({
        next: (list) => {
          this.items = list;
        },
        error: () => {
          // Optionally show error
        }
      });
    }
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
    this.saveList();
  }

  copyList() {
    if (!this.items.length) return;
    const text = this.items.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      // Optionally, show a success message
    });
  }

  saveList() {
  const familyId = this.familyId();
  if (!familyId) return;
  this.shoppingListService.updateShoppingList(familyId, this.items).subscribe();
  }
}
