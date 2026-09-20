import json
import boto3
from decimal import Decimal

# Helper to convert DynamoDB Decimal types to standard float/int for JSON
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('LandParcels')

def lambda_handler(event, context):
    try:
        query_params = event.get("queryStringParameters") or {}
        ulpin = query_params.get("ulpin", "28065010041002").strip()

        response = table.get_item(Key={'ulpin': ulpin})
        item = response.get('Item')

        if not item:
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": json.dumps({"error": f"Parcel {ulpin} not found."})
            }

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(item, cls=DecimalEncoder)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"error": str(e)})
        }