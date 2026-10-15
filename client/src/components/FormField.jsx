// Reusable field wrapper keeps label, required marker, and error rendering
// consistent. The caller supplies an input/select/textarea as children.
export default function FormField({
  label,
  name,
  error,
  children,
  required = false,
}) {
  // A single wrapper ensures the text label and optional error stay associated
  // with the input supplied by each form page.
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {/* Add a visual required marker; browser/API validation remains separate. */}
        {required && " *"}
      </label>
      {children}
      {/* Show field feedback only when validation supplied an error. */}
      {error && (
        <p className="field-error" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
