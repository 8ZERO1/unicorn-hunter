'use client';

import React, { useState, useEffect } from 'react';
import { Auction } from '../lib/types/auction';

interface CardImageProps {
  auction: Auction;
  size?: 'small' | 'medium' | 'large';
  showModal?: boolean;
}

interface ImageModalProps {
  imageUrl: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

// Modal component for full-size image inspection
const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, title, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="image-modal-header">
          <h3 className="image-modal-title">{title}</h3>
          <button className="image-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="image-modal-body">
          <img
            src={imageUrl}
            alt={title}
            className="image-modal-img"
            onError={(e) => {
              // Fallback to placeholder if modal image fails
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiMyMTI1MzQiLz48Y2lyY2xlIGN4PSIzMDAiIGN5PSIyMDAiIHI9IjgwIiBmaWxsPSIjMzc0MTUxIi8+PHRleHQgeD0iMzAwIiB5PSIyMTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q2FyZCBJbWFnZTwvdGV4dD48L3N2Zz4=';
            }}
          />
        </div>
        
        <div className="image-modal-footer">
          <p className="image-modal-hint">
            🔍 Hover over image corners to inspect card condition
          </p>
        </div>
      </div>
    </div>
  );
};

// Main CardImage component
export const CardImage: React.FC<CardImageProps> = ({ 
  auction, 
  size = 'medium', 
  showModal = true 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get appropriate image URLs
  const thumbnailUrl = auction.thumbnail_url || auction.image_url;
  const fullSizeUrl = auction.image_url || auction.thumbnail_url;

  // Sports card placeholder SVG (64x64px)
  const placeholderSvg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSI4IiBmaWxsPSIjMzc0MTUxIi8+PGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMTYiIGZpbGw9IiM2MzY2RjEiLz48dGV4dCB4PSIzMiIgeT0iMzciIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q0FSRFM8L3RleHQ+PC9zdmc+';

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const handleThumbnailClick = () => {
    if (showModal && (fullSizeUrl && !imageError)) {
      setIsModalOpen(true);
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'card-image-small';
      case 'large': return 'card-image-large';
      default: return 'card-image-medium';
    }
  };

  return (
    <>
      <div className={`card-image-container ${getSizeClass()}`}>
        <div 
          className={`card-image-wrapper ${showModal && fullSizeUrl && !imageError ? 'clickable' : ''}`}
          onClick={handleThumbnailClick}
        >
          {isLoading && (
            <div className="card-image-loading">
              <div className="loading-spinner">⚡</div>
            </div>
          )}
          
          <img
            src={imageError ? placeholderSvg : (thumbnailUrl || placeholderSvg)}
            alt={`${auction.card_info?.player || 'Unknown'} card`}
            className="card-image"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Hover magnification overlay */}
          {!imageError && !isLoading && showModal && fullSizeUrl && (
            <div className="card-image-overlay">
              <div className="magnify-icon">🔍</div>
              <div className="overlay-text">Click to view</div>
            </div>
          )}
          
          {/* Error state overlay */}
          {imageError && (
            <div className="card-image-error">
              <div className="error-icon">🃏</div>
            </div>
          )}
        </div>
        
        {/* Size indicators for different use cases */}
        {size === 'small' && <div className="size-indicator">📱</div>}
        {size === 'large' && <div className="size-indicator">🖥️</div>}
      </div>

      {/* Modal for full-size image inspection */}
      {showModal && fullSizeUrl && !imageError && (
        <ImageModal
          imageUrl={fullSizeUrl}
          title={`${auction.card_info?.player || 'Unknown'} - ${auction.card_info?.year} ${auction.card_info?.brand}`}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};