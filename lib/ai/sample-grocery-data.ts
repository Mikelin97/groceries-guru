// Sample grocery product data for testing and knowledge base seeding
export const sampleGroceryProducts = [
  {
    id: "1",
    product_name: "Nature's Path Organic Flax Plus Cereal",
    brand: "Nature's Path",
    category: "Breakfast Cereals",
    price_range: "$6.99-$7.99",
    rating: 4.5,
    content: "High-fiber organic cereal with flax seeds, providing omega-3 fatty acids and 10g of fiber per serving. Made with organic whole grains and no artificial flavors. Great for heart health and digestive wellness. Popular among health-conscious consumers.",
    highlights: ["High fiber", "Omega-3 rich", "Organic", "Heart healthy"],
    nutritional_info: {
      calories_per_serving: 210,
      fiber: "10g",
      protein: "6g",
      sugar: "6g"
    },
    dietary_tags: ["Organic", "Vegan", "High Fiber"]
  },
  {
    id: "2",
    product_name: "Kashi GO Lean Crunch Cereal",
    brand: "Kashi",
    category: "Breakfast Cereals",
    price_range: "$5.49-$6.49",
    rating: 4.3,
    content: "Protein-packed cereal with 13g plant-based protein and 10g fiber per serving. Made with seven whole grains and sesame seeds. Crunchy texture that holds up well in milk. Excellent for post-workout breakfast or sustained energy.",
    highlights: ["13g protein", "Whole grains", "High fiber", "Plant-based"],
    nutritional_info: {
      calories_per_serving: 190,
      fiber: "10g",
      protein: "13g",
      sugar: "6g"
    },
    dietary_tags: ["High Protein", "Whole Grain", "Vegan"]
  },
  {
    id: "3",
    product_name: "Fage Total 0% Greek Yogurt",
    brand: "Fage",
    category: "Dairy",
    price_range: "$5.49-$6.99",
    rating: 4.7,
    content: "Authentic Greek strained yogurt with 20g protein and 0% fat. Thick, creamy texture with tangy flavor. Contains live active cultures for digestive health. Versatile for cooking, baking, or eating plain with toppings.",
    highlights: ["20g protein", "0% fat", "Probiotic", "No added sugar"],
    nutritional_info: {
      calories_per_serving: 130,
      protein: "20g",
      fat: "0g",
      sugar: "9g"
    },
    dietary_tags: ["High Protein", "Low Fat", "Probiotic", "Gluten Free"]
  },
  {
    id: "4",
    product_name: "Three Wishes Grain-Free Cereal",
    brand: "Three Wishes",
    category: "Breakfast Cereals",
    price_range: "$7.99-$8.99",
    rating: 4.6,
    content: "Grain-free cereal made from chickpeas with 8g plant protein per serving. Crunchy texture similar to traditional cereals but without grains or gluten. Low in sugar and high in protein. Great for those following paleo or grain-free diets.",
    highlights: ["Grain-free", "8g protein", "Low sugar", "Chickpea-based"],
    nutritional_info: {
      calories_per_serving: 110,
      protein: "8g",
      fiber: "3g",
      sugar: "3g"
    },
    dietary_tags: ["Grain Free", "Gluten Free", "High Protein", "Paleo Friendly"]
  },
  {
    id: "5",
    product_name: "Oatly Original Oat Milk",
    brand: "Oatly",
    category: "Plant-Based Milk",
    price_range: "$4.99-$5.99",
    rating: 4.4,
    content: "Creamy oat milk with naturally sweet flavor. Fortified with vitamins A, D, and B12. Froths well for coffee drinks. Sustainable plant-based alternative to dairy milk. Contains beta-glucan fiber from oats.",
    highlights: ["Creamy texture", "Fortified vitamins", "Sustainable", "Coffee-friendly"],
    nutritional_info: {
      calories_per_serving: 80,
      protein: "3g",
      fiber: "2g",
      sugar: "7g"
    },
    dietary_tags: ["Vegan", "Dairy Free", "Fortified", "Sustainable"]
  },
  {
    id: "6",
    product_name: "Applegate Organic Turkey Slices",
    brand: "Applegate",
    category: "Deli Meat",
    price_range: "$6.99-$7.99",
    rating: 4.2,
    content: "Organic turkey deli meat with no antibiotics, hormones, or nitrates. Raised on organic pastures with vegetarian feed. Clean ingredient list with natural flavoring. Great for sandwiches and wraps.",
    highlights: ["Organic", "No antibiotics", "No nitrates", "Pasture-raised"],
    nutritional_info: {
      calories_per_serving: 50,
      protein: "9g",
      sodium: "360mg",
      fat: "1g"
    },
    dietary_tags: ["Organic", "No Antibiotics", "No Hormones", "Nitrate Free"]
  },
  {
    id: "7",
    product_name: "Kind Dark Chocolate Nuts & Sea Salt Bar",
    brand: "Kind",
    category: "Snack Bars",
    price_range: "$1.49-$1.99",
    rating: 4.5,
    content: "Whole nut and fruit bar with dark chocolate and sea salt. Made with almonds, peanuts, and walnuts. No artificial flavors or preservatives. Good source of fiber and protein for on-the-go snacking.",
    highlights: ["Whole nuts", "Dark chocolate", "No preservatives", "Portable"],
    nutritional_info: {
      calories_per_serving: 200,
      protein: "6g",
      fiber: "7g",
      sugar: "5g"
    },
    dietary_tags: ["Gluten Free", "Non-GMO", "Kosher"]
  },
  {
    id: "8",
    product_name: "Annie's Organic Mac & Cheese",
    brand: "Annie's",
    category: "Packaged Meals",
    price_range: "$1.99-$2.49",
    rating: 4.1,
    content: "Organic macaroni and cheese made with organic pasta and real cheese. No artificial flavors, synthetic colors, or preservatives. Kid-friendly comfort food with better ingredients than conventional brands.",
    highlights: ["Organic", "Real cheese", "No artificial colors", "Kid-friendly"],
    nutritional_info: {
      calories_per_serving: 270,
      protein: "10g",
      sodium: "560mg",
      calcium: "20% DV"
    },
    dietary_tags: ["Organic", "Vegetarian", "No Artificial Colors"]
  }
];

// Function to format product data for knowledge base insertion
export const formatProductForKnowledgeBase = (product: typeof sampleGroceryProducts[0]) => {
  return {
    id: product.id,
    content: `${product.product_name} by ${product.brand} - ${product.content} Price: ${product.price_range}. Rating: ${product.rating}/5. Key benefits: ${product.highlights.join(', ')}. Suitable for: ${product.dietary_tags.join(', ')} diets.`,
    product_name: product.product_name,
    brand: product.brand,
    category: product.category,
    price_range: product.price_range,
    rating: product.rating,
    highlights: product.highlights,
    dietary_tags: product.dietary_tags,
    nutritional_info: product.nutritional_info
  };
};

export const getAllFormattedProducts = () => {
  return sampleGroceryProducts.map(formatProductForKnowledgeBase);
};