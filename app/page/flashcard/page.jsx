// "use client";
// import { useState } from "react";
// import "./flashcard.css";

// const CARD = {
//   part: "Part 1",
//   question: "Question?",
//   questionBody: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tincidunt diam sed.",
//   answer: "Answer!",
//   answerBody:
//     "Paris is the capital and most populous city of France, with an estimated population of 2.1 million residents.",
// };

// export default function Flashcard() {
//   const [flipped, setFlipped] = useState(false);

//   return (
//     <div className="fc-wrapper">
//       <div className={`fc-card ${flipped ? "is-flipped" : ""}`}>

//         {/* FRONT */}
//         <div className="fc-front">
//           <div>
//             <p className="fc-label">{CARD.part}</p>
//             <h2 className="fc-title">{CARD.question}</h2>
//             <p className="fc-text">{CARD.questionBody}</p>
//           </div>
//           <button className="fc-button" onClick={() => setFlipped(true)}>
//             Answer!
//           </button>
//         </div>

//         {/* BACK */}
//         <div className="fc-back">
//           <div>
//             <p className="fc-label">Answer</p>
//             <h2 className="fc-title">{CARD.answer}</h2>
//             <p className="fc-text">{CARD.answerBody}</p>
//           </div>
//           <button className="fc-button" onClick={() => setFlipped(false)}>
//             Reset ↺
//           </button>
//         </div>

//       </div>
//     </div>
//   );
// }
