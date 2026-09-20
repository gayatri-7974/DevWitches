import json
import boto3

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('LandParcels')

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
}

def lambda_handler(event, context):
    # 1. Handle HTTP OPTIONS preflight check (browser safety check)
    if event.get("httpMethod") == "OPTIONS":
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'CORS OK'})
        }

    # 2. Support both console test events AND live HTTP query parameters
    query_params = event.get('queryStringParameters') or {}
    ulpin = event.get('ulpin') or query_params.get('ulpin')

    if not ulpin:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'ULPIN is required'})
        }

    response = table.get_item(
        Key={'ulpin': ulpin}
    )

    item = response.get('Item')

    if not item:
        return {
            'statusCode': 404,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Land parcel not found'})
        }

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps(item, default=float)
    }