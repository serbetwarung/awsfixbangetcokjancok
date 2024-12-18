# Upload HTML files
aws s3 cp index.html s3://diabetes-prediction-web/
aws s3 cp home.html s3://diabetes-prediction-web/
aws s3 cp chat.html s3://diabetes-prediction-web/
aws s3 cp result.html s3://diabetes-prediction-web/

# Upload JavaScript files
aws s3 cp script.js s3://diabetes-prediction-web/
aws s3 cp chat.js s3://diabetes-prediction-web/
aws s3 cp history.js s3://diabetes-prediction-web/
aws s3 cp result.js s3://diabetes-prediction-web/

# Upload CSS files
aws s3 cp styles.css s3://diabetes-prediction-web/
aws s3 cp chat-styles.css s3://diabetes-prediction-web/
aws s3 cp history-styles.css s3://diabetes-prediction-web/
aws s3 cp result-styles.css s3://diabetes-prediction-web/

# Upload assets folder recursively
aws s3 cp assets s3://diabetes-prediction-web/assets/ --recursive

# Set content types
aws s3 cp s3://diabetes-prediction-web/ s3://diabetes-prediction-web/ --recursive --exclude "*" --include "*.html" --content-type "text/html" --metadata-directive REPLACE
aws s3 cp s3://diabetes-prediction-web/ s3://diabetes-prediction-web/ --recursive --exclude "*" --include "*.css" --content-type "text/css" --metadata-directive REPLACE
aws s3 cp s3://diabetes-prediction-web/ s3://diabetes-prediction-web/ --recursive --exclude "*" --include "*.js" --content-type "application/javascript" --metadata-directive REPLACE
