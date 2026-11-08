import React from 'react';
import { useApp } from '../context/AppContext.js';
import { ProductDetailsPage } from './ProductDetailsPage.js';

export const ProductDetailsModal: React.FC = () => {
  // Product details are rendered natively in-page inside PublicStorefront, ShopCategoryPage,
  // ResellerStorefrontView, and ResellerCatalogTab without floating backdrop dialog popups.
  return null;
};
