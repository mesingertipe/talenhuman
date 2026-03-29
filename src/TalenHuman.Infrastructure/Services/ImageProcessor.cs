using System.IO;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;
using System.Threading.Tasks;

namespace TalenHuman.Infrastructure.Services;

public static class ImageProcessor
{
    /// <summary>
    /// Comprime y redimensiona una imagen si es necesario para optimizar el almacenamiento.
    /// Retorna un nuevo Stream con la imagen procesada o el original si no es procesable.
    /// </summary>
    public static async Task<Stream> ProcessImageAsync(Stream originalStream, string contentType)
    {
        // Solo procesar imágenes comunes (Excluyendo GIF animados y SVG)
        if (!contentType.StartsWith("image/") || contentType.Contains("gif") || contentType.Contains("svg"))
        {
            return originalStream;
        }

        try
        {
            var outputStream = new MemoryStream();
            
            // Asegurar que el stream original esté al inicio
            if (originalStream.CanSeek) originalStream.Position = 0;

            using (var image = await Image.LoadAsync(originalStream))
            {
                // Elite V12 Optimization: Redimensionar si es muy grande (Max 1600px)
                int maxWidth = 1600;
                int maxHeight = 1600;

                if (image.Width > maxWidth || image.Height > maxHeight)
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Size = new Size(maxWidth, maxHeight),
                        Mode = ResizeMode.Max
                    }));
                }

                // Guardar como JPEG con calidad 75 (Balance óptimo entre peso y calidad)
                var encoder = new JpegEncoder { Quality = 75 };
                await image.SaveAsJpegAsync(outputStream, encoder);
            }

            outputStream.Position = 0;
            return outputStream;
        }
        catch
        {
            // Si algo falla durante el procesamiento, retornar el original 
            // (Mejor tener el archivo pesado que perderlo)
            if (originalStream.CanSeek) originalStream.Position = 0;
            return originalStream;
        }
    }
}
