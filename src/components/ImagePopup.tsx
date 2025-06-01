import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
// Import a markdown library (you'll need to install this)
import ReactMarkdown from 'react-markdown'

type PopupProps = {
  imageUrl: string | undefined;
  date: string | undefined;
  text?: string | undefined;
  onClose: () => void;
  isOpen: boolean;
};

const ImagePopup = ({imageUrl, date, text, isOpen, onClose}: PopupProps) => {
  if (!imageUrl || !date) return null

  // Parse the date string to extract month and day
  const dateParts = date.split(' ');
  if (dateParts.length !== 2) return null;

  const monthName = dateParts[0];
  const day = parseInt(dateParts[1]);

  // Map months to their order in the year (0-indexed)
  const monthOrder = {
    'January': 0,
    'February': 1,
    'March': 2,
    'April': 3,
    'May': 4,
    'June': 5,
    'July': 6,
    'August': 7,
    'September': 8,
    'October': 9,
    'November': 10,
    'December': 11
  };

  // Age of the universe in billions of years
  const universeAge = 13.8;

  // Calculate the universe age at this date
  // There are 365 days in a year
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Calculate days from start of year
  let dayOfYear = day;
  for (let i = 0; i < monthOrder[monthName as keyof typeof monthOrder]; i++) {
    dayOfYear += daysInMonth[i];
  }

  // Calculate the fraction of the year that has passed
  const yearFraction = (dayOfYear - 1) / 365;

  // Calculate the universe age at this point
  const ageAtThisPoint = universeAge * yearFraction;

  // Format the age with proper units (billions or millions of years)
  let ageDisplay;
  if (ageAtThisPoint < 0.001) {
    // If less than a million years, show in thousands
    ageDisplay = `${(ageAtThisPoint * 1000000).toFixed(2)} thousand years`;
  } else if (ageAtThisPoint < 1) {
    // If less than a billion, show in millions
    ageDisplay = `${(ageAtThisPoint * 1000).toFixed(2)} million years`;
  } else {
    // Otherwise show in billions
    ageDisplay = `${ageAtThisPoint.toFixed(2)} billion years`;
  }

  const formattedTitle = `${date} - Age of Universe: ${ageDisplay}`;

  console.log({ imageUrl, date, text, isOpen });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-auto bg-gray-800"
        showCloseButton={true}
      >
        <DialogTitle className="text-xl text-white font-semibold">{formattedTitle}</DialogTitle>
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
          {text && (
            <div className="prose prose-invert prose-sm max-w-none px-4 py-3 bg-gray-700 rounded-md md:flex-1">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )}

          <img
            src={imageUrl}
            alt={`Image for ${date}`}
            className="max-w-full max-h-[50vh] object-contain mx-auto md:max-w-[45%]"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImagePopup
