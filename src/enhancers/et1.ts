export const enhance = ({ THE_FUNCTION }: { THE_FUNCTION: any }) => {
  return () => `${THE_FUNCTION()} enhanced.`
}
