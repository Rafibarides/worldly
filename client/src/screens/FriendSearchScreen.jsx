const handleSearch = async (term) => {
  if (!term.trim()) {
    setResults([]);
    return;
  }
  setLoading(true);
  setError(null);
  try {
    const usersRef = collection(database, "users");
    // Fetch all users, then filter below
    const q = query(
      usersRef,
      orderBy("username_lower")
    );
    const querySnapshot = await getDocs(q);
    const users = [];
    const lowerTerm = term.toLowerCase();
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Exclude current user and match case-insensitively
      if (
        data.uid !== currentUser.uid &&
        data.username_lower.includes(lowerTerm)
      ) {
        users.push(data);
      }
    });
    setResults(users);
  } catch (err) {
    console.error("Error searching users: ", err);
    setError("Error searching users.");
  } finally {
    setLoading(false);
  }
}; 