import { Route } from '@angular/router';
import { ShoppingListComponent } from './shopping-list';

export const SHOPPING_LIST_ROUTES: Route[] = [
  {
    path: '',
    component: ShoppingListComponent,
    title: 'Shopping List'
  }
];
