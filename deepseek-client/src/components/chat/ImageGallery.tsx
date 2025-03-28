import { Box } from '@mantine/core';

// 背景图库组件
export function ImageGallery({
  onSelect,
  isDark,
}: {
  onSelect: (url: string) => void;
  isDark: boolean;
}) {
  // 背景图列表
  const presetImages: string[] = [];

  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
      }}
    >
      {presetImages.map((img, index) => (
        <Box
          key={index}
          style={{
            width: '100%',
            aspectRatio: '1/1',
            borderRadius: 4,
            overflow: 'hidden',
            cursor: 'pointer',
            border: `1px solid ${isDark ? '#373A40' : '#e9ecef'}`,
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
          onClick={() => onSelect(img)}
        >
          <img
            src={img}
            alt={`Background ${index + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
      ))}
    </Box>
  );
}
