// Contract testing utility
export const testContractFunctions = async (contracts) => {
  if (!contracts.multiPropertyManager) {
    console.error('MultiPropertyManager contract not available');
    return false;
  }

  try {
    console.log('Testing contract functions...');
    
    // Test basic contract info
    console.log('Contract address:', contracts.multiPropertyManager.target);
    console.log('Contract runner:', !!contracts.multiPropertyManager.runner);
    console.log('Contract signer:', !!contracts.multiPropertyManager.signer);
    
    // Test available functions
    const functions = [
      'nextPropertyId',
      'properties',
      'addProperty',
      'mintTokens',
      'buyTokens',
      'owner'
    ];
    
    const availableFunctions = {};
    for (const func of functions) {
      availableFunctions[func] = typeof contracts.multiPropertyManager[func] === 'function';
    }
    
    console.log('Available functions:', availableFunctions);
    
    // Test nextPropertyId specifically
    try {
      const nextId = await contracts.multiPropertyManager.nextPropertyId();
      console.log('✅ nextPropertyId works:', nextId.toString());
      return true;
    } catch (error) {
      console.error('❌ nextPropertyId failed:', error);
      return false;
    }
    
  } catch (error) {
    console.error('Contract test failed:', error);
    return false;
  }
};
