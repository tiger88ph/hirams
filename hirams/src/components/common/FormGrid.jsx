import React, { useEffect, useRef, useState } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Switch,
  FormControl,
  InputLabel,
  Typography,
  InputAdornment,
  IconButton,
  Skeleton,
  Box,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
// ── Custom field type icons ───────────────────────────────────────────────────
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined"; // TIN
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined"; // Bank
import LockOutlinedIcon from "@mui/icons-material/LockOutlined"; // Password
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail"; // Email
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined"; // Phone
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined"; // Username

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// ── Icon map for special field types ─────────────────────────────────────────
const FIELD_TYPE_META = {
  tin: {
    icon: BadgeOutlinedIcon,
    inputMode: "numeric",
    placeholder: "000-000-000-00000",
  },
  bank: {
    icon: AccountBalanceOutlinedIcon,
    inputMode: "numeric",
    placeholder: "Account number",
  },
  password: { icon: LockOutlinedIcon, inputMode: undefined, placeholder: "" },
  email: {
    icon: AlternateEmailIcon,
    inputMode: "email",
    placeholder: "you@example.com",
  },
  phone: {
    icon: PhoneIphoneOutlinedIcon,
    inputMode: "tel",
    placeholder: "0900-000-0000",
  },
  username: {
    icon: AccountCircleOutlinedIcon,
    inputMode: undefined,
    placeholder: "Username",
  },
};

const ICON_SX = { fontSize: "1rem", color: "text.secondary" };

export default function FormGrid({
  fields = [],
  switches = [],
  formData = {},
  errors = {},
  handleChange,
  handleSwitchChange,
  onLastFieldTab,
  autoFocus = true,
}) {
  const firstInputRef = useRef(null);
  const inputRefs = useRef([]);
  const [showPassword, setShowPassword] = useState({});
  const [pesoDisplayValues, setPesoDisplayValues] = useState({});
  const [selectSearch, setSelectSearch] = useState({});

  const togglePasswordVisibility = (name) =>
    setShowPassword((prev) => ({ ...prev, [name]: !prev[name] }));

  // Add this ABOVE the existing useEffect
  // Reset firstInputRef before fields are re-mapped
  firstInputRef.current = null;
  useEffect(() => {
    if (autoFocus === false) return;
    const timer = setTimeout(() => firstInputRef.current?.focus(), 300); // slight bump
    return () => clearTimeout(timer);
  }, [autoFocus]);
  // useEffect(() => {
  //   if (!autoFocus) return;
  //   const timer = setTimeout(() => firstInputRef.current?.focus(), 200);
  //   return () => clearTimeout(timer);
  // }, [autoFocus]); // autoFocus changes on each step → re-triggers

  const handleKeyDown = (e, index, multiline) => {
    if (!multiline) {
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const nextIndex = index + 1;
        if (nextIndex < inputRefs.current.length) {
          inputRefs.current[nextIndex]?.focus();
        } else if (onLastFieldTab) {
          onLastFieldTab();
        }
      }
    }
  };

  // ── Quill renderer (unchanged) ────────────────────────────────────────────
  const renderQuill = (field, index) => {
    const bgColor = "#fafafa";
    let toolbarOptions = [];

    if (field.showOnlyHighlighter) {
      toolbarOptions = [[{ background: [] }]];
    } else if (
      field.showHighlighter === false &&
      field.showAllFormatting !== false
    ) {
      toolbarOptions = [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }],
      ];
    } else if (field.showAllFormatting !== false) {
      toolbarOptions = [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }],
        [{ background: [] }],
      ];
    } else {
      toolbarOptions = false;
    }

    const transparentStyle =
      field.showHighlighter === false
        ? `.ql-editor span[style*="background-color"] { background-color: transparent !important; }`
        : "";

    const quillMinHeight = field.showOnlyHighlighter ? "40vh" : "150px";
    const uniqueClass = field.readOnlyHighlight
      ? `ql-readonly-${field.name.replace(/[^a-zA-Z0-9]/g, "_")}`
      : "";

    return (
      <>
        {field.showHighlighter === false && <style>{transparentStyle}</style>}
        <style>{`
          .ql-editor { max-height: ${field.maxHeight || 300}px; min-height: ${quillMinHeight}; overflow-y: auto; }
          ${field.readOnlyHighlight ? `.${uniqueClass} .ql-editor { caret-color: transparent; cursor: default; user-select: text; }` : ""}
        `}</style>
        <FormControl fullWidth size="small" error={!!errors[field.name]}>
          <InputLabel
            shrink
            sx={{ backgroundColor: bgColor, px: 0.5, borderRadius: 0.25 }}
          >
            {field.label}
          </InputLabel>
          <ReactQuill
            theme="snow"
            value={formData[field.name] || ""}
            onChange={(val) => {
              if (field.readOnlyHighlight) {
                const stripTags = (html) => html.replace(/<[^>]*>/g, "");
                if (stripTags(val) !== stripTags(formData[field.name] || ""))
                  return;
              }
              handleChange({ target: { name: field.name, value: val } });
            }}
            placeholder={field.placeholder || ""}
            modules={{ toolbar: toolbarOptions }}
            readOnly={field.readOnly}
            className={uniqueClass}
            style={{
              minHeight: field.minRows ? field.minRows * 24 : 100,
              backgroundColor: bgColor,
            }}
            ref={(el) => {
              inputRefs.current[index] = el;
              if (el && field.readOnlyHighlight) {
                const editor = el.getEditor?.();
                if (editor && !editor.__readOnlyBound) {
                  editor.__readOnlyBound = true;
                  editor.root.addEventListener("keydown", (e) => {
                    const isAllowed =
                      (e.ctrlKey &&
                        ["c", "a", "z"].includes(e.key.toLowerCase())) ||
                      [
                        "ArrowLeft",
                        "ArrowRight",
                        "ArrowUp",
                        "ArrowDown",
                        "Tab",
                      ].includes(e.key);
                    if (!isAllowed) e.preventDefault();
                  });
                  editor.root.addEventListener("paste", (e) =>
                    e.preventDefault(),
                  );
                  editor.root.addEventListener("cut", (e) =>
                    e.preventDefault(),
                  );
                  editor.root.setAttribute("contenteditable", "false");
                }
              }
            }}
          />
          {errors[field.name] && (
            <Typography variant="caption" color="error">
              {errors[field.name]}
            </Typography>
          )}
        </FormControl>
      </>
    );
  };

  // ── Special typed field renderer ─────────────────────────────────────────
  const renderSpecialField = (field, index) => {
    const meta = FIELD_TYPE_META[field.type];
    const IconComp = meta.icon;
    const isPassword = field.type === "password";
    const visible = showPassword[field.name];

    // TIN: format as 000-000-000-000 on change
    const handleTinChange = (e) => {
      let raw = e.target.value.replace(/\D/g, "").slice(0, 14);
      const parts = [];
      for (let i = 0; i < raw.length; i += 3) parts.push(raw.slice(i, i + 3));
      handleChange({ target: { name: field.name, value: parts.join("-") } });
    };

    // Bank / Phone: digits only
    const handleNumericChange = (e) => {
      const raw = e.target.value.replace(/\D/g, "");
      handleChange({ target: { name: field.name, value: raw } });
    };

    const changeHandler =
      field.type === "tin"
        ? handleTinChange
        : field.type === "bank"
          ? handleNumericChange
          : field.type === "phone"
            ? handleNumericChange
            : handleChange;

    return (
      <Grid item xs={12} sm={field.xs || 12} key={field.name}>
        <TextField
          label={field.label}
          name={field.name}
          fullWidth
          size="small"
          type={isPassword ? (visible ? "text" : "password") : "text"}
          inputMode={meta.inputMode}
          value={formData[field.name] || ""}
          error={!!errors[field.name]}
          helperText={errors[field.name] || field.helperText || ""}
          disabled={field.disabled}
          placeholder={field.placeholder ?? meta.placeholder}
          inputRef={(el) => {
            inputRefs.current[index] = el;
            if (!firstInputRef.current) firstInputRef.current = el;
          }}
          onKeyDown={(e) => handleKeyDown(e, index, false)}
          onChange={changeHandler}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconComp sx={ICON_SX} />
              </InputAdornment>
            ),
            ...(isPassword && {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility(field.name)}
                    edge="end"
                    size="small"
                    disabled={field.disabled}
                  >
                    {visible ? (
                      <Visibility sx={ICON_SX} />
                    ) : (
                      <VisibilityOff sx={ICON_SX} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }),
          }}
        />
      </Grid>
    );
  };

  return (
    <Grid container spacing={1.5}>
      {fields.map((field, index) => {
        // ── Special icon fields ──────────────────────────────────────────────
        if (FIELD_TYPE_META[field.type]) {
          return renderSpecialField(field, index);
        }

        const isDateField = ["date", "time", "datetime-local"].includes(
          field.type,
        );
        const disabled = field.dependsOn ? !formData[field.dependsOn] : false;
        // ── Custom render ─────────────────────────────────────────────────────────
        if (field.type === "custom" && field.render) {
          return (
            <Grid item xs={12} sm={field.xs || 12} key={field.name}>
              {field.render()}
            </Grid>
          );
        }
        // ── Peso field ───────────────────────────────────────────────────────
        if (field.type === "peso") {
          const rawStored = formData[field.name];
          const displayValue =
            pesoDisplayValues[field.name] !== undefined
              ? pesoDisplayValues[field.name]
              : rawStored !== undefined && rawStored !== ""
                ? Number(rawStored).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "";

          return (
            <Grid item xs={12} sm={field.xs || 12} key={field.name}>
              <TextField
                label={field.label}
                name={field.name}
                type="text"
                fullWidth
                size="small"
                value={displayValue}
                error={!!errors[field.name]}
                helperText={errors[field.name] || field.helperText || ""}
                disabled={field.disabled}
                placeholder={field.placeholder || "0.00"}
                inputRef={(el) => {
                  inputRefs.current[index] = el;
                  if (!firstInputRef.current) firstInputRef.current = el;
                }}
                onKeyDown={(e) => {
                  handleKeyDown(e, index, false);
                  const allowedKeys = [
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "Tab",
                    "Enter",
                    ".",
                  ];
                  if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key))
                    e.preventDefault();
                }}
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, "");
                  if (/^\d*\.?\d{0,2}$/.test(raw)) {
                    setPesoDisplayValues((prev) => ({
                      ...prev,
                      [field.name]: raw,
                    }));
                    handleChange({ target: { name: field.name, value: raw } });
                  }
                }}
                onBlur={() => {
                  const raw = formData[field.name];
                  setPesoDisplayValues((prev) => {
                    const u = { ...prev };
                    delete u[field.name];
                    return u;
                  });
                  if (raw !== "" && raw !== undefined && !isNaN(Number(raw))) {
                    handleChange({
                      target: {
                        name: field.name,
                        value: Number(raw).toFixed(2),
                      },
                    });
                  }
                }}
                onFocus={() => {
                  const raw = formData[field.name];
                  const unformatted =
                    raw !== "" && raw !== undefined && !isNaN(Number(raw))
                      ? String(Number(raw))
                      : "";
                  setPesoDisplayValues((prev) => ({
                    ...prev,
                    [field.name]: unformatted,
                  }));
                }}
                InputProps={{
                  readOnly: field.InputProps?.readOnly,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        ₱
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          );
        }

        // ── Select field ─────────────────────────────────────────────────────
        if (field.type === "select") {
          const options = field.options || [];
          const isLoadingOptions = field.loading === true; // ← only show skeleton when explicitly loading

          return (
            <Grid item xs={12} sm={field.xs || 12} key={field.name}>
              <TextField
                select
                fullWidth
                size="small"
                label={field.label}
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                error={!!errors[field.name]}
                helperText={errors[field.name] || ""}
                inputRef={(el) => {
                  inputRefs.current[index] = el;
                  if (!firstInputRef.current) firstInputRef.current = el;
                }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: { sx: { maxHeight: 300 } },
                    autoFocus: false,
                  },
                  onOpen: () => {
                    if ((field.options || []).length > 8) {
                      setTimeout(() => {
                        const input = document.getElementById(
                          `select-search-${field.name}`,
                        );
                        if (input) input.focus();
                      }, 50);
                    }
                  },
                  onClose: () =>
                    setSelectSearch((prev) => ({ ...prev, [field.name]: "" })),
                }}
              >
                {options.length > 8 && (
                  <MenuItem
                    disableRipple
                    disableTouchRipple
                    onKeyDown={(e) => e.stopPropagation()}
                    sx={{
                      p: 0,
                      "&:hover": { backgroundColor: "transparent" },
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                      backgroundColor: "#fff",
                    }}
                  >
                    <TextField
                      id={`select-search-${field.name}`}
                      size="small"
                      placeholder="Search..."
                      fullWidth
                      value={selectSearch[field.name] || ""}
                      onChange={(e) =>
                        setSelectSearch((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => e.stopPropagation()}
                      sx={{ px: 1, py: 0.5 }}
                      autoComplete="off"
                    />
                  </MenuItem>
                )}

                {isLoadingOptions ? (
                  [1, 2, 3].map((i) => (
                    <MenuItem key={i} disabled sx={{ py: 0.8 }}>
                      <Skeleton
                        variant="text"
                        width={`${45 + i * 15}%`}
                        height={14}
                        sx={{ borderRadius: 1 }}
                      />
                    </MenuItem>
                  ))
                ) : options.filter((opt) =>
                    opt.label
                      ?.toLowerCase()
                      .includes((selectSearch[field.name] || "").toLowerCase()),
                  ).length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="caption" color="text.disabled">
                      No data available
                    </Typography>
                  </MenuItem>
                ) : (
                  options
                    .filter((opt) =>
                      opt.label
                        ?.toLowerCase()
                        .includes(
                          (selectSearch[field.name] || "").toLowerCase(),
                        ),
                    )
                    .map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))
                )}
              </TextField>
            </Grid>
          );
        }

        // ── Section label ────────────────────────────────────────────────────
        if (field.type === "label") {
          return (
            <Grid item xs={12} key={`label-${index}`}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 200, color: "text.primary" }}
              >
                {field.label}
              </Typography>
            </Grid>
          );
        }

        // ── Checkbox ─────────────────────────────────────────────────────────
        if (field.type === "checkbox") {
          return (
            <Grid item xs={field.xs || 12} key={field.name}>
              <FormControlLabel
                control={
                  <Checkbox
                    name={field.name}
                    checked={!!formData[field.name]}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label={field.label || ""}
              />
            </Grid>
          );
        }

        // ── Multiline / Quill ─────────────────────────────────────────────────
        if (field.multiline) {
          if (field.plainMultiline) {
            return (
              <Grid item xs={12} sm={field.xs || 12} key={field.name}>
                <TextField
                  label={field.label}
                  name={field.name}
                  placeholder={field.placeholder}
                  fullWidth
                  size="small"
                  multiline
                  minRows={field.minRows || 3}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  error={!!errors[field.name]}
                  helperText={errors[field.name] || ""}
                  inputRef={(el) => (inputRefs.current[index] = el)}
                  onKeyDown={(e) => handleKeyDown(e, index, true)}
                />
              </Grid>
            );
          }
          return (
            <Grid item xs={12} sm={field.xs || 12} key={field.name}>
              {renderQuill(field, index)}
            </Grid>
          );
        }

        // ── Normal TextField (including legacy password without icon) ─────────
        const isPassword = field.type === "password";
        return (
          <Grid item xs={12} sm={field.xs || 12} key={field.name}>
            <TextField
              label={field.label}
              name={field.name}
              type={
                isPassword
                  ? showPassword[field.name]
                    ? "text"
                    : "password"
                  : field.type || "text"
              }
              fullWidth
              size="small"
              value={formData[field.name] || ""}
              error={!!errors[field.name]}
              helperText={errors[field.name] || field.helperText || ""}
              disabled={field.disabled || disabled}
              placeholder={field.placeholder || ""}
              InputLabelProps={isDateField ? { shrink: true } : {}}
              inputRef={(el) => {
                inputRefs.current[index] = el;
                if (!firstInputRef.current) firstInputRef.current = el;
              }}
              onKeyDown={(e) => {
                handleKeyDown(e, index, field.multiline);
                if (field.numberOnly) {
                  const allowedKeys = [
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "Tab",
                    "Enter",
                  ];
                  if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key))
                    e.preventDefault();
                }
              }}
              onChange={(e) => {
                let value = e.target.value;
                if (field.numberOnly) value = value.replace(/[^0-9]/g, "");
                handleChange({ target: { name: field.name, value } });
              }}
              InputProps={
                isPassword
                  ? {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility(field.name)}
                            edge="end"
                            disabled={field.disabled || disabled}
                          >
                            {showPassword[field.name] ? (
                              <Visibility />
                            ) : (
                              <VisibilityOff />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }
                  : {}
              }
            />
          </Grid>
        );
      })}

      {switches.map((sw) => (
        <Grid item xs={sw.xs || 12} key={sw.name}>
          <FormControlLabel
            control={
              <Switch
                name={sw.name}
                checked={!!formData[sw.name]}
                onChange={handleSwitchChange}
                color="primary"
              />
            }
            label={
              sw.mobileLabel ? (
                <Box component="span">
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    {sw.label}
                  </Box>
                  <Box component="span" sx={{ display: { sm: "none" } }}>
                    {sw.mobileLabel}
                  </Box>
                </Box>
              ) : (
                sw.label || ""
              )
            }
          />
        </Grid>
      ))}
    </Grid>
  );
}
