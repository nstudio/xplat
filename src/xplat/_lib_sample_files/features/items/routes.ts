import { Routes } from '@angular/router';

import { environment } from '@<%= npmScope %>/core';
const homePath = `/${environment.baseRoutePath}`;

export interface IRouteBase {
  base: string;
}

export function routeBase(lazyLoad: IRouteBase, additional: Routes = [], redirectTo: string = homePath): Routes {
  return [
    {
      path: environment.baseRoutePath,
      loadChildren: lazyLoad.base
    },
    ...additional
  ];
}

export function routeItems(index: any, detail: any): Routes {
  return [
    {
      path: '',
      component: index
    },
    {
      path: ':id',
      component: detail,
    },
  ];
}
