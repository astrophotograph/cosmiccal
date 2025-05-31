import { useEffect, useState } from 'react';

type PopupProps = {
  imageUrl: string;
  date: string;
  onClose: () => void;
};

const ImagePopup = ({ imageUrl, date, onClose }: PopupProps) => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 p-4 rounded-lg shadow-lg max-w-2xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl text-white font-semibold">{date}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <img
          src={imageUrl}
          alt={`Image for ${date}`}
          className="max-w-full max-h-[70vh] object-contain mx-auto"
        />
      </div>
    </div>
  );
};

export default ImagePopup;
