import {useEffect, useState} from 'react'
import GridRectangle from './components/GridRectangle'
import BeginButton from './components/BeginButton'
import ImagePopup from './components/ImagePopup'
import type {DateImageEntry} from './components/types'

function App() {
  const currentYear = new Date().getFullYear()
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 50, // Reserve space for footer
  })

  // State for the image popup
  const [popupImage, setPopupImage] = useState<{ imageUrl: string; date: string; text?: string } | null>(null)

  // Create example array of dates and images
  const exampleDateImages: DateImageEntry[] = [
    {
      date: new Date(currentYear, 0, 15), // January 15
      imageUrl: 'https://picsum.photos/150/150?random=1',
      text: "# January Memory\n\nThis was a cold winter day when we went skiing in the mountains. The view was **spectacular**!"
    },
    {
      date: new Date(currentYear, 1, 14), // February 14
      imageUrl: 'https://picsum.photos/150/150?random=2',
      text: "# Valentine's Day\n\nA special dinner at our favorite restaurant. *So romantic!*"
    },
    {
      date: new Date(currentYear, 2, 17), // March 17
      imageUrl: 'https://picsum.photos/150/150?random=3',
      text: "# St. Patrick's Day\n\n- Green beer\n- Shamrock decorations\n- Irish music all day long"
    },
    {
      date: new Date(currentYear, 3, 1), // April 1
      imageUrl: 'https://picsum.photos/150/150?random=4',
      text: "# April Fools' Day\n\nThe prank with the water bucket was hilarious! 😂"
    },
    {
      date: new Date(currentYear, 4, 25), // May 25
      imageUrl: 'https://picsum.photos/150/150?random=5',
      text: "# Spring Picnic\n\nFirst outdoor meal of the season. Perfect weather."
    },
    {
      date: new Date(currentYear, 5, 10), // June 10
      imageUrl: 'https://picsum.photos/150/150?random=6',
      text: "# Summer Beach Day\n\n> The ocean was so blue today, I couldn't believe my eyes."
    },
    {
      date: new Date(currentYear, 6, 4), // July 4
      imageUrl: 'https://picsum.photos/150/150?random=7',
      text: "# Independence Day\n\nThe fireworks display was amazing this year!"
    },
    {
      date: new Date(currentYear, 7, 8), // August 8
      imageUrl: 'https://picsum.photos/150/150?random=8',
      text: "# Camping Trip\n\nSpent the weekend under the stars. Saw a shooting star!"
    },
    {
      date: new Date(currentYear, 8, 21), // September 21
      imageUrl: 'https://picsum.photos/150/150?random=9',
      text: "# Autumn Begins\n\nThe leaves are starting to change color. Beautiful reds and oranges."
    },
    {
      date: new Date(currentYear, 9, 31), // October 31
      imageUrl: 'https://picsum.photos/150/150?random=10',
      text: "# Halloween\n\nBest costume party ever! I went as a zombie programmer."
    },
    {
      date: new Date(currentYear, 10, 24), // November 24
      imageUrl: 'https://picsum.photos/150/150?random=11',
      text: "# Thanksgiving\n\n1. Turkey\n2. Stuffing\n3. Pumpkin pie\n\nEverything was delicious!"
    },
    {
      date: new Date(currentYear, 11, 25), // December 25
      imageUrl: 'https://picsum.photos/150/150?random=12',
      text: "# Christmas Day\n\nOpening presents by the fire. A perfect holiday."
    },
  ]

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 50, // Reserve space for footer
      })
    }

    handleResize() // Initial call
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Event listener for showing the image popup
  useEffect(() => {
    const handleShowImagePopup = (event: CustomEvent) => {
      setPopupImage(event.detail)
    }

    window.addEventListener('showImagePopup', handleShowImagePopup as EventListener)

    return () => {
      window.removeEventListener('showImagePopup', handleShowImagePopup as EventListener)
    }
  }, [])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      <div className="absolute inset-0" style={{bottom: '50px'}}>
        <GridRectangle
          width={dimensions.width}
          height={dimensions.height}
          dateImages={exampleDateImages}
        />
      </div>
      <BeginButton/>
      <footer className="fixed bottom-0 left-0 w-full h-[50px] py-3 bg-gray-800 text-gray-400 text-center text-sm z-50">
        <p>© {currentYear} the authors. All rights reserved.</p>
      </footer>

      {/* Render the image popup when an image is clicked */}
      <ImagePopup
        imageUrl={popupImage?.imageUrl}
        date={popupImage?.date}
        text={popupImage?.text}
        onClose={() => setPopupImage(null)}
        isOpen={popupImage !== null}
      />
    </div>
  )
}

export default App
