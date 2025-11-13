# React-to-Print Conversion Guide

## How to Verify You're Using React-to-Print

### ✅ Signs You're Using React-to-Print:

1. **Import Statement**: Look for `import { useReactToPrint } from 'react-to-print'`
2. **useRef Hook**: Look for `const printRef = useRef()` or similar
3. **useReactToPrint Hook**: Look for `const handlePrint = useReactToPrint({ content: () => printRef.current, ... })`
4. **No window.open()**: The code should NOT use `window.open('', '_blank')` for printing
5. **Hidden Print Content**: There should be a hidden `<div ref={printRef}>` with the print content

### ❌ Signs You're Using Old Method (window.open):

1. `window.open('', '_blank')` or `window.open('', 'PRINT', ...)`
2. `printWindow.document.write(...)`
3. `printWindow.document.close()`
4. `printWindow.print()`
5. `printWindow.close()`

## Standard Pattern for React-to-Print

```javascript
// 1. Import required hooks
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

// 2. Create ref and print handler
const printRef = useRef();
const handlePrint = useReactToPrint({
  content: () => printRef.current,
  documentTitle: 'Your_Document_Title',
});

// 3. Create hidden print content (usually at end of component)
<div ref={printRef} style={{ display: 'none' }}>
  {/* Your print content here */}
</div>

// 4. Call handlePrint when button is clicked
<Button onClick={handlePrint}>Print</Button>
```

## Conversion Status

### ✅ Completed Conversions:

1. **src/pages/shared/AboutPage.jsx** - Print page functionality
2. **src/pages/04_BranchManager/Staff.jsx** - Staff report printing
3. **src/pages/05_Receptionist/POSBilling.jsx** - Receipt printing
4. **src/pages/04_BranchManager/Reports.jsx** - Already using react-to-print
5. **src/pages/04_BranchManager/Transactions.jsx** - Already using react-to-print

### ⚠️ Still Needs Conversion:

1. **src/pages/04_BranchManager/Appointments.jsx** - Has `printReport()` and single appointment print
2. **src/pages/04_BranchManager/Schedule.jsx** - Has `openPrintPage()` function
3. **src/pages/05_Receptionist/ReceptionistAppointments.jsx** - Has `generatePrintReport()` and `handlePrintSingleAppointment()`
4. **src/services/receiptService.js** - Service file using window.open (may need different approach)

## Quick Verification Commands

Search for old print patterns:
```bash
# Search for window.open in print contexts
grep -r "window.open.*print\|printWindow" src/

# Search for react-to-print usage
grep -r "useReactToPrint" src/
```

## Benefits of React-to-Print

1. ✅ No pop-up blockers
2. ✅ Better browser compatibility
3. ✅ More control over print styling
4. ✅ Works with React state and props
5. ✅ No need to manage window lifecycle
6. ✅ Better error handling

## Example: Before vs After

### Before (window.open):
```javascript
const handlePrint = () => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`<html>...</html>`);
  printWindow.document.close();
  printWindow.print();
  printWindow.close();
};
```

### After (react-to-print):
```javascript
const printRef = useRef();
const handlePrint = useReactToPrint({
  content: () => printRef.current,
  documentTitle: 'Report',
});

// In JSX:
<div ref={printRef} style={{ display: 'none' }}>
  {/* Content */}
</div>
<Button onClick={handlePrint}>Print</Button>
```

