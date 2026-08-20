import { useState, useRef } from 'react';
import { api } from '../services/api.js';
import { IconImage, IconTrash, IconStar, IconClose } from './Icons.jsx';

// Multi-image uploader with drag & drop, preview, reorder, main-image, delete.
// value: [{ url, isMain }]  onChange: (images) => void
// single: when true, acts as a single image picker (returns url via onChange)
export default function ImageUploader({ value = [], onChange, single = false }) {
  const [uploading, setUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const inputRef = useRef(null);

  const images = single ? (value ? [{ url: value, isMain: true }] : []) : value;

  const doUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const { urls } = await api.upload(files);
      if (single) { onChange(urls[0]); }
      else {
        const next = [...images, ...urls.map((url, i) => ({ url, isMain: images.length === 0 && i === 0 }))];
        onChange(next);
      }
    } catch (e) { alert(e.message || 'Upload failed'); }
    setUploading(false);
  };

  const onDrop = (e) => { e.preventDefault(); doUpload(e.dataTransfer.files); };
  const removeAt = (i) => {
    if (single) { onChange(''); return; }
    const next = images.filter((_, idx) => idx !== i);
    if (images[i].isMain && next.length) next[0].isMain = true;
    onChange(next);
  };
  const setMain = (i) => onChange(images.map((im, idx) => ({ ...im, isMain: idx === i })));

  const onDragStart = (i) => setDragIdx(i);
  const onDragOver = (e) => e.preventDefault();
  const onDropReorder = (i) => {
    if (dragIdx === null || dragIdx === i) return;
    const next = [...images];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    onChange(next);
    setDragIdx(null);
  };

  return (
    <div className="uploader">
      <div className="uploader-drop" onDrop={onDrop} onDragOver={(e) => e.preventDefault()} onClick={() => inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept="image/*" multiple={!single} hidden onChange={(e) => doUpload(e.target.files)} />
        {uploading ? <span className="spin" /> : <><IconImage size={22} /><span>{single ? 'Upload image' : 'Drag & drop or click to upload'}</span></>}
      </div>
      {images.length > 0 && (
        <div className="uploader-grid">
          {images.map((im, i) => (
            <div key={im.url + i} className={`uploader-thumb ${im.isMain ? 'is-main' : ''}`}
              draggable={!single} onDragStart={() => onDragStart(i)} onDragOver={onDragOver} onDrop={() => onDropReorder(i)}>
              <img src={im.url} alt="" />
              <div className="uploader-thumb-actions">
                {!single && <button type="button" title="Set main" onClick={() => setMain(i)} className={im.isMain ? 'active' : ''}><IconStar size={14} /></button>}
                <button type="button" title="Remove" onClick={() => removeAt(i)}><IconTrash size={14} /></button>
              </div>
              {im.isMain && !single && <span className="uploader-main-badge">Main</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
