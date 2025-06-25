import { MilvusClient, } from "@zilliz/milvus2-sdk-node";


const address = "http://localhost:19530";

// connect to milvus
const client = new MilvusClient({address});




export const findRelevantContent = async (userQuery: string) => {
    // load collection
    const collectionName = "fmcg_v1"; 

    // load collection
    await client.loadCollectionSync({
        collection_name: collectionName,
        });

    const res = await client.search({
        collection_name: collectionName, // required, the collection name
        data: [userQuery],
        anns_field: "content_dense",
        limit: 3, // specify the number of nearest neighbors to return
        output_fields: ["content"], // optional, specify the fields to return in the search results
    });
  
  return res;
};