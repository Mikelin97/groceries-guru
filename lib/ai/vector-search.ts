// Vector search implementation using Alibaba Cloud Bailian SDK
// Supports both mock data (development) and Model Studio vector search (production)

import Client, { RetrieveRequest } from '@alicloud/bailian20231229';
import * as OpenApi from '@alicloud/openapi-client';

export interface ProductResult {
  content: string;
  product_name: string;
  brand: string;
  category: string;
  price_range: string;
  rating: number;
  score: number;
}

export interface SearchResponse {
  success: boolean;
  results: ProductResult[];
  query: string;
  total_results?: number;
  message?: string;
  error?: string;
}

// Mock product data for development
const mockProducts: ProductResult[] = [
  {
    content: "Healthy whole grain cereal with high fiber and protein",
    product_name: "Organic Steel Cut Oats",
    brand: "Nature's Best",
    category: "Breakfast Cereals",
    price_range: "$3-5",
    rating: 4.5,
    score: 0.95
  },
  {
    content: "Low sugar, high protein breakfast cereal with almonds",
    product_name: "Protein Crunch Cereal",
    brand: "FitFood",
    category: "Breakfast Cereals",
    price_range: "$5-7",
    rating: 4.2,
    score: 0.88
  },
  {
    content: "Gluten-free granola with dried fruits and nuts",
    product_name: "Mountain Trail Granola",
    brand: "Wilderness",
    category: "Breakfast Cereals",
    price_range: "$4-6",
    rating: 4.7,
    score: 0.82
  }
];

// Initialize Bailian SDK client
let bailianClient: Client | null = null;

const getBailianClient = (): Client => {
  if (!bailianClient) {
    const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
    const endpoint = process.env.BAILIAN_ENDPOINT || 'bailian.cn-beijing.aliyuncs.com';
    const regionId = process.env.ALIBABA_CLOUD_REGION || 'cn-beijing';

    if (!accessKeyId || !accessKeySecret) {
      throw new Error('Alibaba Cloud credentials (ACCESS_KEY_ID and ACCESS_KEY_SECRET) are required');
    }

    // Use the proper OpenApi.Config for Alibaba Cloud SDKs
    // Alibaba Cloud SDKs expect just the hostname without protocol
    const finalEndpoint = endpoint.replace(/^https?:\/\//, '');
    
    const config = new OpenApi.Config({
      accessKeyId,
      accessKeySecret,
      endpoint: finalEndpoint,
      regionId
    });

    bailianClient = new Client(config);
  }

  return bailianClient;
};

// Search using Alibaba Cloud Bailian SDK
const searchBailian = async (query: string): Promise<SearchResponse> => {
  const workspaceId = process.env.BAILIAN_WORKSPACE_ID;
  const indexId = process.env.BAILIAN_INDEX_ID;

  if (!workspaceId || !indexId) {
    throw new Error('Bailian workspace ID and index ID are required');
  }

  try {
    const client = getBailianClient();

    // Create retrieve request
    const retrieveRequest = new RetrieveRequest({
      query: query,
      indexId: indexId,
      denseSimilarityTopK: 10,
      sparseSimilarityTopK: 10, 
      enableReranking: true,
      rerankTopN: 5  // Must be <= (denseSimilarityTopK + sparseSimilarityTopK)
    });

    // Call the retrieve API
    const response = await client.retrieve(workspaceId, retrieveRequest);

    if (!response.body?.data?.nodes) {
      return {
        success: false,
        results: [],
        query,
        message: 'No results found'
      };
    }

    // Parse and format results
    const results: ProductResult[] = response.body.data.nodes.map(node => {
      // Try to parse metadata if it contains structured product info
      let productInfo = {
        content: node.text || '',
        product_name: 'Unknown Product',
        brand: '',
        category: '',
        price_range: '',
        rating: 0,
        score: node.score || 0
      };

      // If metadata contains structured product information, use it
      if (node.metadata) {
        try {
          const metadata = typeof node.metadata === 'string' 
            ? JSON.parse(node.metadata) 
            : node.metadata;
          
          productInfo = {
            content: node.text || '',
            product_name: metadata.product_name || productInfo.product_name,
            brand: metadata.brand || productInfo.brand,
            category: metadata.category || productInfo.category,
            price_range: metadata.price_range || productInfo.price_range,
            rating: metadata.rating || productInfo.rating,
            score: node.score || 0
          };
        } catch {
          // If metadata parsing fails, use default values
        }
      }

      return productInfo;
    });

    return {
      success: true,
      results,
      query,
      total_results: results.length
    };

  } catch (error) {
    console.error('Bailian search error:', error);
    throw error;
  }
};

// Mock search for development
const searchMock = async (userQuery: string): Promise<SearchResponse> => {
  console.log(`🔍 Mock search for: "${userQuery}"`);
  
  // Simple keyword matching for demo
  const queryLower = userQuery.toLowerCase();
  const matchedProducts = mockProducts.filter(product => 
    product.content.toLowerCase().includes(queryLower) ||
    product.product_name.toLowerCase().includes(queryLower) ||
    product.category.toLowerCase().includes(queryLower)
  );

  if (matchedProducts.length > 0) {
    return {
      success: true,
      results: matchedProducts,
      query: userQuery,
      total_results: matchedProducts.length
    };
  }

  // If no matches, return all products as fallback
  return {
    success: true,
    results: mockProducts.slice(0, 3),
    query: userQuery,
    total_results: 3,
    message: "Showing general recommendations"
  };
};

export const findRelevantContent = async (userQuery: string): Promise<SearchResponse> => {
  try {
    const useCloudDB = process.env.USE_CLOUD_VECTOR_DB === 'true';
    
    if (useCloudDB) {
      console.log(`🌐 Bailian search for: "${userQuery}"`);
      return await searchBailian(userQuery);
    } else {
      console.log(`🏠 Mock search for: "${userQuery}"`);
      return await searchMock(userQuery);
    }

  } catch (error) {
    console.error('Search error:', error);
    
    // Fallback to mock data if cloud search fails
    console.log('Falling back to mock data...');
    return await searchMock(userQuery);
  }
};

// Initialize cloud vector DB (Bailian)
export const initializeCloudVectorDB = async () => {
  if (process.env.USE_CLOUD_VECTOR_DB !== 'true') {
    console.log('🔧 Cloud vector DB disabled, using mock data');
    return;
  }

  console.log('🚀 Initializing Bailian SDK...');
  
  try {
    // Test the client initialization
    getBailianClient();
    console.log('✅ Bailian SDK client initialized successfully');
    
    // Note: Index and data management should be done through Alibaba Cloud console
    console.log('💡 Make sure your Bailian workspace and index are configured in the console');
    
  } catch (error) {
    console.error('❌ Bailian initialization failed:', error);
    throw error;
  }
};