import { Typography, Box, Stack, Paper } from "@mui/material";
import "./App.css";
import Container from "./components/Container";
import HalfRating from "./components/Stars";
import MinHeightTextarea from "./components/InputField";
import SubmitButton from "./components/Button";
import BinauralBeatPlayer from "./components/BinauralBeatsVisualizer";

function App() {
  return (
    // <Box
    //   sx={{
    //     padding: 4,
    //     display: "flex",
    //     justifyContent: "center",
    //     alignItems: "center",
    //   }}
    // >
    //   <Paper elevation={3} sx={{ padding: 4, maxWidth: 500, width: "100%" }}>
    //     <Stack spacing={4} sx={{ alignItems: 'center'}}>
    //       <Typography variant="h5" component="h1" >
    //         How do you <b>feel</b> today?
    //       </Typography>

    //       <HalfRating />

    //       <MinHeightTextarea />

    //       <SubmitButton />
    //     </Stack>
    //   </Paper>
    // </Box>
    <BinauralBeatPlayer/>
  );
}

export default App;
