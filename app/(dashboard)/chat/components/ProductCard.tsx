import { ShoppingCart, Star } from 'lucide-react';

interface ProductRecommendation {
  name: string;
  brand?: string;
  price: string;
  rating: number;
  reviews: number;
  highlights: string[];
  category: string;
  image?: string;
}

interface ProductCardProps {
  product: ProductRecommendation;
}

export const ProductCard = ({ product }: ProductCardProps) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <div className="flex gap-3">
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
        <ShoppingCart className="h-6 w-6 text-gray-400" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
            {product.brand && (
              <p className="text-xs text-gray-500">{product.brand}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-bold text-green-600">{product.price}</p>
            <p className="text-xs text-gray-500">{product.category}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-600 ml-1">{product.rating}</span>
          </div>
          <span className="text-xs text-gray-400">({product.reviews} reviews)</span>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {product.highlights.map((highlight, index) => (
            <span
              key={index}
              className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full"
            >
              {highlight}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export type { ProductRecommendation };