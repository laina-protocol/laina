use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum LoanManagerError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    LoanAlreadyExists = 3,
    InvalidLoanInStorage = 4,
}
