import * as React from 'react';
import TextareaAutosize from '@mui/material/TextareaAutosize';

export default function MinHeightTextarea() {
  return (
    <TextareaAutosize
      aria-label="minimum height"
      minRows={3}
      placeholder="How are you feeling today?"
      style={{
        width: '100%',
        backgroundColor: 'white',
        color: '#000',
        borderRadius: 4,
        padding: 8,
        border: '1px solid #ccc',
        fontFamily: 'inherit',
        fontSize: '1rem',
      }}
    />
  );
}
