FROM jdub233/nginx-basic-auth-static-oc

# copy static files to the image
COPY ./build /app/static
