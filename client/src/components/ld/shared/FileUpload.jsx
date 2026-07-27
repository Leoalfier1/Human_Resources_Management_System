import React, { useState, useRef, useEffect } from 'react';

const uid = () => `fu-${Math.random().toString(36).slice(2, 9)}`;

/**
 * FileUpload — shared upload widget used across the L&D Admin Portal.
 *
 * Usage (render-prop):
 *   <FileUpload endpoint="..." extraFormData={{...}} onSuccess={fn} onError={fn}>
 *     {({ status }) => <div>Upload File</div>}
 *   </FileUpload>
 *
 * The component renders a hidden <input type="file"> and an outer wrapper that
 * calls inputRef.current.click() on every click so the OS file-picker always
 * opens — regardless of what DOM structure is nested inside.
 */
const FileUpload = ({
  id,
  accept,
  capture,
  multiple,
  disabled,
  endpoint,
  extraFormData,
  onSuccess,
  onError,
  children,
  className,
  style,
}) => {
  const inputId  = id || uid();
  const inputRef = useRef(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'

  // Reset back to idle after success or error so the button re-enables.
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const t = setTimeout(() => setStatus('idle'), 2500);
      return () => clearTimeout(t);
    }
  }, [status]);

  // Triggered when the user picks a file.
  const handleChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setStatus('uploading');

    const fd   = new FormData();
    const file = multiple ? files : files[0];
    fd.append('file', file);

    if (extraFormData) {
      Object.entries(extraFormData).forEach(([k, v]) =>
        fd.append(k, typeof v === 'function' ? v(file) : v)
      );
    }

    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(endpoint, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      setStatus('success');
      onSuccess?.(data, file);
    } catch (err) {
      setStatus('error');
      onError?.(err);
    } finally {
      // Always clear the input so the same file can be re-selected if needed.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  // Imperatively open the OS file-picker.
  // Using onClick here (instead of relying on htmlFor alone) guarantees the
  // picker opens even when the child content has nested interactive elements.
  const handleClick = (e) => {
    if (disabled || status === 'uploading') {
      e.preventDefault();
      return;
    }
    e.preventDefault(); // prevent double-trigger from htmlFor
    inputRef.current?.click();
  };

  const isActive = !disabled && status !== 'uploading';

  return (
    <>
      {/* Wrapper div — acts as the clickable area */}
      <div
        role="button"
        tabIndex={isActive ? 0 : -1}
        aria-disabled={!isActive}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick(e);
        }}
        className={className}
        style={{
          cursor: isActive ? 'pointer' : 'default',
          userSelect: 'none',
          ...style,
        }}
      >
        {typeof children === 'function' ? children({ status }) : children}
      </div>

      {/* Hidden file input — programmatically triggered via inputRef.click() */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        capture={capture}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={handleChange}
        tabIndex={-1}
      />
    </>
  );
};

export default FileUpload;
