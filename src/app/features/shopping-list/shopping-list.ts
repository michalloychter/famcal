
import { Component, OnInit, computed, signal, PLATFORM_ID, Inject, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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

  items = signal<string[]>([]);
  newItem = '';
  showDeleteModal = false;

  constructor(
    private shoppingListService: ShoppingListService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Use effect to react to auth state changes
    effect(() => {
      const user = this.authService.currentUser();
      const familyId = this.familyId();
      if (isPlatformBrowser(this.platformId) && user && familyId && familyId !== 'null') {
        console.log("Auth state changed, loading shopping list for familyId:", familyId);
        this.loadShoppingList(familyId);
      } else {
        console.warn("Cannot load shopping list - familyId is null or invalid:", familyId);
      }
    });
  }

  deleteListAndCloseModal() {
    this.items.set([]);
    this.saveList();
    this.showDeleteModal = false;
  }

  readonly familyId = computed(() => {
    const user = this.authService.currentUser();
    return user?.familyId ? String(user.familyId) : (user?.id ? String(user.id) : null);
  });

  ngOnInit() {
    // ngOnInit is called during SSR, so we don't load here
    // The effect in constructor will handle loading when browser is ready
    console.log("=== ShoppingList ngOnInit (may be SSR) ===");
  }

  loadShoppingList(familyId: string) {
    console.log("=== loadShoppingList START ===");
    console.log("Loading shopping list for familyId:", familyId);
    
    this.shoppingListService.getShoppingList(familyId).subscribe({
      next: (list) => {
        console.log("Shopping list received from server:", list);
        this.items.set(list || []);
        console.log("Items set to:", this.items());
      },
      error: (err) => {
        console.error("Error getting shopping list:", err);
        console.error("Error status:", err.status);
        console.error("Error message:", err.message);
        console.error("Error body:", err.error);
        this.items.set([]);
      }
    });
  }

  addItem() {
    const item = this.newItem.trim();
    const familyId = this.familyId();
    if (item && familyId) {
      // Optimistically add to UI
      this.items.update(items => [...items, item]);
      this.newItem = '';
      this.shoppingListService.addProduct(familyId, item).subscribe({
        next: (list) => {
          this.items.set(list);
        },
        error: () => {
          // Optionally show error
        }
      });
    }
  }

  removeItem(index: number) {
    this.items.update(items => items.filter((_, i) => i !== index));
    this.saveList();
  }

  copyList() {
    const currentItems = this.items();
    if (!currentItems.length) return;
    const text = currentItems.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      // Optionally, show a success message
    });
  }

  saveList() {
  const familyId = this.familyId();
  if (!familyId) return;
  this.shoppingListService.updateShoppingList(familyId, this.items()).subscribe();
  }
  confirmNewList() {
    if (confirm('Are you sure you want to start a new list? This will delete the current list.')) {
      this.items.set([]);
      this.saveList();
    }
  }
}
