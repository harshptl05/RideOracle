from flask import Blueprint, request, jsonify
from db import Database

vehicle_route = Blueprint('user', __name__)
db = None  # Define a placeholder for the db instance


def init_blueprint(database):
    """Initialize the blueprint with a database instance."""
    global db
    db = database

@vehicle_route.route ('/get_vehicle_by_car_engine' , methods=['GET'])
def get_cars_by_car_engine():
    print("Request Headers:", request.headers)
    print("Request Data:", request.data)  # Raw request body
    print("Request JSON:", request.json)
    data = request.json  # Ensure proper parsing of JSON input
    car_engine = data.get('Car_Engine')
    try:
        # Call the stored procedure
        query = """CALL GetCarsByCarEngine(%s)"""
        result = db.execute_query(query, (car_engine,), fetchall=True)

        if result:
            return jsonify({
                "Vehicles": result
            }), 200
        else:
            return jsonify({
                "message": "No cars found. "
            }), 404

    except Exception as e:
        return jsonify({
            "message": f"Failed to fetch cars: {str(e)}"
        }), 500

# 
@vehicle_route.route ('/get_cars_by_fuel_type' , methods=['GET'])
def get_cars_by_fuel_type():
    print("Request Headers:", request.headers)
    print("Request Data:", request.data)  # Raw request body
    print("Request JSON:", request.json)
    data = request.json  # Ensure proper parsing of JSON input
    fuel_type = data.get('Fuel_type')
    try:
        # Call the stored procedure
        query = """CALL GetCarsByFuelType(%s)"""
        result = db.execute_query(query, (fuel_type,), fetchall=True)

        if result:
            return jsonify({
                "Vehicles": result
            }), 200
        else:
            return jsonify({
                "message": "No cars found. "
            }), 404

    except Exception as e:
        return jsonify({
            "message": f"Failed to fetch cars: {str(e)}"
        }), 500
    


#
@vehicle_route.route ('/get_cars_by_filter' , methods=['GET'])
def get_cars_by_filter():
    print("Request Headers:", request.headers)
    print("Request Data:", request.data)  # Raw request body
    print("Request JSON:", request.json)
    data = request.json  # Ensure proper parsing of JSON input
    min_price = data.get('Min_Price')
    max_price = data.get('Max_Price')
    color_combo = data.get('Color_Combo')
    vehicle_type = data.get('Vehicle_Type')
    try:
        # Call the stored procedure
        query = """CALL GetCarsByFilter(%s,%s,%s,%s)"""
        result = db.execute_query(query, (min_price, max_price, color_combo, vehicle_type), fetchall=True)

        if result:
            return jsonify({
                "Vehicles": result
            }), 200
        else:
            return jsonify({
                "message": "No cars found. "
            }), 404

    except Exception as e:
        return jsonify({
            "message": f"Failed to fetch cars: {str(e)}"
        }), 500
    


# 
@vehicle_route.route ('/get_cars_by_score' , methods=['GET'])
def get_cars_by_score():
    print("Request Headers:", request.headers)
    print("Request Data:", request.data)  # Raw request body
    print("Request JSON:", request.json)
    data = request.json  # Ensure proper parsing of JSON input
    color_combo = data.get('Colors')
    vehicle_type_v = data.get('Vehicle_Type')
    min_price  = data.get('Min_Price')
    max_price  = data.get('Max_Price')

    try:
        # Call the stored procedure
        query = """CALL GetVehicleByScore(%s, %s, %s, %s)"""
        result = db.execute_query(query, (color_combo, vehicle_type_v, min_price, max_price), fetchall=True)

        if result:
            return jsonify({
                "Vehicles": result
            }), 200
        else:
            return jsonify({
                "message": "No cars found. "
            }), 404

    except Exception as e:
        return jsonify({
            "message": f"Failed to fetch cars: {str(e)}"
        }), 500
    

# 
@vehicle_route.route('/get_cars_by_algo', methods=['POST'])
def get_cars_by_algo():
    print("Request Headers:", request.headers)
    print("Request Data:", request.data)  # Raw request body
    print("Request JSON:", request.json)
    
    data = request.json  # Ensure proper parsing of JSON input
    
    # Get parameters from the request
    color_combo = data.get('Colors', '')  # Default to empty string if not provided
    vehicle_type_v = data.get('Vehicle_Type', '')  # Default to empty string if not provided
    min_price = data.get('Min_Price')  # Default to None if not provided
    max_price = data.get('Max_Price')  # Default to None if not provided
    fuel_type_v = data.get('Fuel_Type', '')  # Default to empty string if not provided
    local_mpg_v = data.get('Local_MPG', None)  # Default to None if not provided
    highway_mpog = data.get('Highway_MPG', None)  # Default to None if not provided
    model_year = data.get('Model_Year', None)  # Default to None if not provided

    try:
        # Prepare the parameters for the stored procedure call

        # Call the stored procedure
        query = """CALL GetVehicleByScoreAdvanced(%s, %s, %s, %s, %s, %s, %s, %s)"""
        result = db.execute_query(query, (color_combo,
            vehicle_type_v,
            min_price,
            max_price,
            fuel_type_v,
            local_mpg_v,
            highway_mpog,
            model_year), fetchall=True)

        if result:
            return jsonify({
                "Vehicles": result
            }), 200
        else:
            return jsonify({
                "message": "No cars found."
            }), 404

    except Exception as e:
        return jsonify({
            "message": f"Failed to fetch cars: {str(e)}"
        }), 500

@vehicle_route.route('/get_vehicle_details', methods=['POST'])
def get_vehicle_details():
    print("Request Headers:", request.headers)
    print("Request Data:", request.data)  # Raw request body
    print("Request JSON:", request.json)

    # Parse the JSON input
    data = request.json
    sku_ids = data.get('Sku_ids')  # Get the SKU IDs from the request JSON

    if not sku_ids:
        return jsonify({
            "message": "No SKU IDs provided."
        }), 400

    try:
        # Call the stored procedure with the selected SKU IDs
        query = """CALL GetVehicleDetailsBySKU(%s)"""
        result = db.execute_query(query, (sku_ids,), fetchall=True)

        if result:
            return jsonify({
                "Vehicles": result
            }), 200
        else:
            return jsonify({
                "message": "No vehicle details found for the provided SKU IDs."
            }), 404

    except Exception as e:
        return jsonify({
            "message": f"Failed to fetch vehicle details: {str(e)}"
        }), 500


@vehicle_route.route('/get_all_vehicles', methods=['GET'])
def get_all_vehicles():
    try:
        # Query to fetch all records from the Sku table
        query = "CALL GetAllVehicles()"


        result = db.execute_query(query, fetchall=True)

        if result:
            # If records are found, return the result as JSON
            return jsonify({
                "vehicles": result
            }), 200
        else:
            # If no records are found
            return jsonify({
                "message": "No vehicles found."
            }), 404

    except Exception as e:
        # Handle any errors
        return jsonify({
            "message": f"Failed to fetch vehicles: {str(e)}"
        }), 500