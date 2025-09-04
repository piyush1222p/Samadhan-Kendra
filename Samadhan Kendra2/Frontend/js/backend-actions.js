import { upvoteIssue, redeemReward } from "./api.js";

window.backendUpvote = async function backendUpvote(issueId) {
  try {
    const out = await upvoteIssue(issueId);
    localStorage.setItem("userPoints", String(out.newBalance || 0));
    if (typeof initializePointsDisplay === "function") initializePointsDisplay();
    if (typeof showNotification === "function")
      showNotification("Thanks for upvoting! Points added.", "success");
  } catch (e) {
    if (typeof showNotification === "function")
      showNotification(e?.data?.error || "Upvote failed", "error");
  }
};

window.backendRedeem = async function backendRedeem(rewardType, cost) {
  try {
    const out = await redeemReward({ rewardType, points: cost });
    localStorage.setItem("userPoints", String(out.newBalance || 0));
    if (typeof initializePointsDisplay === "function") initializePointsDisplay();
    if (typeof showNotification === "function")
      showNotification(`Redeemed ${rewardType}. New balance: ${out.newBalance}`, "success");
  } catch (e) {
    if (typeof showNotification === "function")
      showNotification(e?.data?.error || "Redemption failed", "error");
  }
};