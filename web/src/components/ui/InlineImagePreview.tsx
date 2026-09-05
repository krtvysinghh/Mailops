import React, { useState, useEffect, useRef } from 'react';

interface InlineImagePreviewProps {
  htmlBody: string;
  altText?: string;
}

export const InlineImagePreview: React.FC<InlineImagePreviewProps> = ({ htmlBody, altText = 'Email preview' }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract first image URL from HTML body
  useEffect(() => {
    if (!htmlBody) return;

    // Simple regex to extract src from img tags
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
    const match = htmlBody.match(imgRegex);

    if (match && match[1]) {
      // Avoid tracking pixels or spacer gifs (common in emails)
      const src = match[1];
      if (!src.includes('pixel') && !src.includes('spacer') && !src.includes('tracker')) {
        setImageUrl(src);
      }
    }
  }, [htmlBody]);

  // Set up IntersectionObserver for lazy loading
  useEffect(() => {
    if (!imageUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' } // Load slightly before it comes into view
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [imageUrl]);

  if (!imageUrl || hasError) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginLeft: '12px',
        border: '1px solid #e0e0e0'
      }}
      className="inline-image-preview"
      title={altText}
    >
      {isVisible ? (
        <img 
          src={imageUrl} 
          alt={altText}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 1,
            transition: 'opacity 0.3s ease-in'
          }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#e9ecef' }} />
      )}
    </div>
  );
};
