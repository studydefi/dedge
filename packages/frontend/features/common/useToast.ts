export const useToastShowLoading = (tx, action: string) => {
  window.toastProvider.addMessage(`${action.charAt(0).toUpperCase() + action.substring(1)}...`, {
    secondaryMessage: "Check progress on Etherscan",
    actionHref: `https://etherscan.io/tx/${tx.hash}`,
    actionText: "Check",
    variant: "processing",
  });
};

export const useToastHandleException = (tx, action: string) => {
  if (tx === null) {
    window.toastProvider.addMessage(`Transaction cancelled`, {
      variant: "failure",
    });
  } else {
    window.toastProvider.addMessage(`Failed to ${action.toLowerCase()}...`, {
      secondaryMessage: "Check reason on Etherscan",
      actionHref: `https://etherscan.io/tx/${tx.hash}`,
      actionText: "Check",
      variant: "failure",
    });
  }
};
