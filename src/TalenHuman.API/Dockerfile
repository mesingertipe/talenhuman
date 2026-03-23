# TalenHuman.API Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY src/TalenHuman.API/TalenHuman.API.csproj src/TalenHuman.API/
COPY src/TalenHuman.Application/TalenHuman.Application.csproj src/TalenHuman.Application/
COPY src/TalenHuman.Domain/TalenHuman.Domain.csproj src/TalenHuman.Domain/
COPY src/TalenHuman.Infrastructure/TalenHuman.Infrastructure.csproj src/TalenHuman.Infrastructure/
RUN dotnet restore src/TalenHuman.API/TalenHuman.API.csproj

# Copy everything else and build
COPY . .
WORKDIR /app/src/TalenHuman.API
# Cache bust: 3
RUN dotnet publish "src/TalenHuman.API/TalenHuman.API.csproj" -c Release -o /out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /out .
RUN ls -la .
EXPOSE 8080
ENTRYPOINT ["dotnet", "TalenHuman.API.dll"]
