from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
import datetime
from pymongo import MongoClient
from flask_cors import CORS
from dotenv import load_dotenv
import os

app = Flask(__name__)
CORS(app)

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")


client = MongoClient(MONGO_URI)
db = client['book_reviews']

#test connection
@app.route('/test-connection', methods=['GET'])
def test_connection():
    try:
        db.command("ping")  #ping the db for connection test
        return jsonify({"message": "MongoDB connection is successful!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#get reviews selectively by filtering
@app.route('/reviews', methods=['GET'])
def get_reviews():
    try:
        #get filter and sort params from the query string
        rating_filter = request.args.get('rating', type=int)
        sort_order = request.args.get('sort', default='desc', type=str)
   
        query = {}
        if rating_filter is not None:  #filtering by rating
            query['rating'] = {"$eq": rating_filter}

        print("Query sent to MongoDB:", query)

        #sort by date, default is descending order
        sort_direction = 1 if sort_order == 'asc' else -1
        reviews = list(db.reviews.find(query).sort('dateAdded', sort_direction))

        print("Reviews fetched:", reviews)

        for review in reviews:
            review['_id'] = str(review['_id'])  #convert ObjectId to string
            review['dateAdded'] = review['dateAdded'].strftime('%Y-%m-%d %H:%M:%S')  #timestamp


        return jsonify(reviews)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


#add a new review
@app.route('/reviews', methods=['POST'])
def add_review():
    data = request.get_json()
    book_title = data.get('bookTitle')
    author = data.get('author')
    rating = data.get('rating')
    review_text = data.get('reviewText')
    date_added = datetime.datetime.now()

    if not all([book_title, author, rating, review_text]):
        return jsonify({"error": "Missing required fields"}), 400

    #insert into MongoDB
    review_id = db.reviews.insert_one({
        "bookTitle": book_title,
        "author": author,
        "rating": rating,
        "reviewText": review_text,
        "dateAdded": date_added
    }).inserted_id

    return jsonify({"message": "Review added", "id": str(review_id)}), 201


#update a review
@app.route('/reviews/<id>', methods=['PUT'])
def update_review(id):
    data = request.get_json()
    updated_data = {
        "bookTitle": data.get('bookTitle'),
        "author": data.get('author'),
        "rating": data.get('rating'),
        "reviewText": data.get('reviewText'),
        "dateAdded": datetime.datetime.now()
    }

    db.reviews.update_one({'_id': ObjectId(id)}, {'$set': updated_data})

    return jsonify({"message": "Review updated"})


#delete a review
@app.route('/reviews/<id>', methods=['DELETE'])
def delete_review(id):
    db.reviews.delete_one({'_id': ObjectId(id)})
    return jsonify({"message": "Review deleted"})


if __name__ == '__main__':
    app.run(debug=True)
