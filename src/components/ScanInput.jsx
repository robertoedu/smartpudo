import {
  TextField,
  InputAdornment,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CameraAltIcon from "@mui/icons-material/CameraAlt";

export default function ScanInput({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
  helperText,
  onKeyDown,
  disabled,
  onCameraClick,
  inputRef,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      helperText={helperText}
      disabled={disabled}
      inputRef={inputRef}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <QrCodeScannerIcon />
          </InputAdornment>
        ),
        endAdornment:
          isMobile && onCameraClick && !disabled ? (
            <InputAdornment position="end">
              <IconButton
                onClick={onCameraClick}
                edge="end"
                color="primary"
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                  width: 40,
                  height: 40,
                }}
              >
                <CameraAltIcon />
              </IconButton>
            </InputAdornment>
          ) : null,
      }}
    />
  );
}
