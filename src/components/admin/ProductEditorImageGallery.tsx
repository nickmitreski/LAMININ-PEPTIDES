import { Upload, Image as ImageIcon, Star, Trash2 } from 'lucide-react';
import { Heading, Text } from '../ui/Typography';
import type { ProductImage } from './productEditorTypes';

type Props = {
  images: ProductImage[] | undefined;
  uploading: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetPrimary: (imageId: string) => void;
  onDeleteImage: (imageId: string, storagePath: string) => void;
};

export default function ProductEditorImageGallery({
  images,
  uploading,
  onFileSelect,
  onSetPrimary,
  onDeleteImage,
}: Props) {
  return (
    <div>
      <Heading level={3} className="mb-4">
        Product images
      </Heading>

      <div className="mb-4">
        <label className="block">
          <div className="border-2 border-dashed border-carbon-300 rounded-sm p-6 text-center cursor-pointer hover:border-accent-500 transition-colors">
            <Upload className="w-8 h-8 mx-auto mb-2 text-carbon-400" />
            <Text className="text-carbon-600 mb-1">
              {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </Text>
            <Text className="text-sm text-carbon-500">PNG, JPG, WebP up to 5MB</Text>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </div>
        </label>
      </div>

      {images && images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={`relative group border-2 rounded-sm overflow-hidden ${
                image.is_primary ? 'border-accent-500' : 'border-carbon-200'
              }`}
            >
              <img
                src={image.image_url}
                alt={image.file_name}
                className="w-full h-32 object-cover"
              />

              {image.is_primary && (
                <div className="absolute top-2 left-2 bg-accent-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Primary
                </div>
              )}

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.is_primary && (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(image.id)}
                    className="p-2 bg-white rounded hover:bg-accent-50 transition-colors min-h-11 min-w-11 touch-manipulation"
                    title="Set as primary"
                  >
                    <Star className="w-4 h-4 text-accent-600" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteImage(image.id, image.storage_path)}
                  className="p-2 bg-white rounded hover:bg-error-light transition-colors min-h-11 min-w-11 touch-manipulation"
                  title="Delete image"
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-carbon-300 rounded-sm">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-carbon-300" />
          <Text className="text-carbon-500">No images yet</Text>
          <Text className="text-sm text-carbon-400">Upload images to display them here</Text>
        </div>
      )}
    </div>
  );
}
