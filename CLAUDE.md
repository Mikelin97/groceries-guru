I am building an easy to use application to help regular consumers with their daily grocery shopping experience. Often times, consumers are overwhelmed with the number of choices available to them in the grocery store. My application will help them make better decisions by providing personalized recommendations based on their preferences and dietary restrictions.

The interface will be a simple and intuitive chatting experience, as if interacting with a friend who has extensive knowledge of the products available. In particular, the chatting portion feels like a conversation; in the meantime, 3-5 most relevant comments about this  product or similar products (based on different categories, for example, for shampoo, it could be about its scent, dryness, or price, for snacks, it could be about its taste, texture, or price) will be displayed to the user to provide additional context and information. It continues to flow like a conversation. At extreme cases when the product does not have any reviews, the guru will blantly say that it does not have any personalized recommendations for this product, but he can help with the analysis of the product based on its ingredients, nutritional information. A few more details to note about the interface: 
    - It supports bilingual conversations (English and Chinese), so there should be an accessible toggle button to switch between the two languages. By default, the guru understands both languages and can respond in either language based on the user's preference. In particular, the guru must always provide the 3-5 most relevant comments in the language toggled by the user. 
    - The active inputs come from three sources: text, voice, and images. The interface should have intuitive ways for users to provide inputs in these formats. 
    - It has an intuitive user sign-up and login process, allowing users to create accounts easily and securely. 
    - It has a direct payment system that allows users to pay for premium features or memberships powered by Stripe. The payment system should be secure and user-friendly, ensuring a smooth transaction process. 

The backend is composed of two main components:
1. A database storing user information such as account details, preferences, and membership status.
2. A recommendation engine. 

The first component is a standard relational database, with a conventional backend API and logics. It handles user authentication, stores user preferences, manages user payments. 
The second component is very very very critial. It has read and write access to a vector database powered by Milvus that stores vectorized product information, user id, user's age, gender, region, and his/her comment about the product. The recommendation engine's most critial logic is: 
    1. Given Inputs: User's active inputs (text, voice, image) , user's passive inputs (historical interactions)
    2. First has an in-depth analysis to have the most comprehensive knowledge about the product interested, tools such as web search should be used to gather additional information, and LLM should be used to analyze the images and voices. 
    3. Then, construct an efficient query to the vector database to retrieve the most relevant products based on the user's inputs and preferences.
    4. Given the retrieved information passing a rigorously designed threshold to ensure relevance, then the retrived information will also be considered as valid inputs. 
    5. Finally, based on the user's inputs and the retrieved information, the recommendation engine will generate personalized recommendations, which will be presented to the user in a conversational format.


As a following up design task, after we complete the above basic componenets. We will design an interface where users can chip in their own comments about the products they have used, and these comments will be stored in the vector database. The recommendation engine will then use these user-generated comments to further enhance the personalized recommendations for future users. 


