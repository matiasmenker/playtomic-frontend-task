import { FormEventHandler, useState } from "react";
import Alert from "@mui/material/Alert";
import MaterialButton from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import { useAuth } from "@/lib/auth";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";
import MuiCard from "@mui/material/Card";
import Box from "@mui/material/Box";

export interface LoginProps {
  initialValues?: {
    email?: string;
    password?: string;
  };
}

const Logo = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignSelf: "center",
        width: "60px",
        height: "80px",
        borderRadius: "4px",
        img: {
          borderRadius: "8px",
        },
      }}
    >
      <img
        src={
          "https://scontent-mad2-1.xx.fbcdn.net/v/t39.30808-6/466425116_1200971608049513_9169463776648796533_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=i3KXDvb_i0AQ7kNvgFc6Wpk&_nc_zt=23&_nc_ht=scontent-mad2-1.xx&_nc_gid=ALsULOLB86BaPJCsqdPqx2j&oh=00_AYDxOsqIkWoKZxm4zwDt4ugOA73qCX17LoQ2Q9cJKkZiHA&oe=67675F02"
        }
      />
    </Box>
  );
};

const LoginContainer = styled(Stack)({
  display: "flex",
  height: "100vh",
  flexDirection: "column",
  alignSelf: "center",
  justifyContent: "center",
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage:
      "url(https://res.cloudinary.com/playtomic/image/upload/q_auto,f_auto/v1649677895/playtomic/web/banner.webp)",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
  },
});

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  [theme.breakpoints.up("sm")]: {
    maxWidth: "450px",
  },
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const Button = styled(MaterialButton)({
  boxShadow: "none",
  textTransform: "none",
  fontSize: "18px",
  padding: "10px 35px",
  borderRadius: "26px",
  border: "1px solid",
  lineHeight: 1.5,
  color: "#FFFFFF",
  marginTop: "20px",
  backgroundColor: "#335fff",
  "&:hover": {
    backgroundColor: "#335fff",
  },
  "&:active": {
    backgroundColor: "#335fff",
  },
});

export function Login(props: LoginProps) {
  const { initialValues, ...otherProps } = props;

  const auth = useAuth();
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [password, setPassword] = useState(initialValues?.password ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();

    setError(null);
    setIsSubmitting(true);

    auth
      .login({ email, password })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <LoginContainer direction="column" justifyContent="space-between">
      <Card {...otherProps}>
        <form
          aria-label="Log in"
          aria-busy={isSubmitting ? true : undefined}
          onSubmit={handleSubmit}
        >
          <Stack spacing={8}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignSelf: "center",
                width: "80px",
                height: "80px",
                borderRadius: "4px",
                img: {
                  borderRadius: "8px",
                },
              }}
            >
              <Logo />
            </Box>
            <Stack spacing={[2]}>
              <TextField
                size="small"
                disabled={isSubmitting}
                label="Email"
                type="email"
                name="email"
                value={email}
                onChange={(ev) => {
                  setEmail(ev.target.value);
                }}
              />
              <TextField
                size="small"
                disabled={isSubmitting}
                label="Password"
                type="password"
                name="password"
                value={password}
                onChange={(ev) => {
                  setPassword(ev.target.value);
                }}
              />

              {error && (
                <Alert
                  severity="error"
                  onClose={() => {
                    setError(null);
                  }}
                >
                  {error}
                </Alert>
              )}
            </Stack>
            <Button type="submit">
              {isSubmitting ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                "Log in"
              )}
            </Button>
          </Stack>
        </form>
      </Card>
    </LoginContainer>
  );
}
