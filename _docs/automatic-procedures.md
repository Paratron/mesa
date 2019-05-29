# Automatic Procedures
SOL will generate automatic procedures you can use in your connectors.

## user.create
Requires a user with the right `user.create`.

Requires the arguments:
```json
{
  "mail": "test@example.com",
  "password": "the new password",
  "groups": "comma,separated,groups"
}
```

Will return a user object. The password will be encrypted.


## user.update
Requires a user with the right `user.update`.

If the password is overwritten, it will be encrypted.


## user.auth
Can take two types of arguments objects:

```json
{
  "mail": "test@example.com",
  "password": "password"
}
```

Or:

```json
{
  "token": "61t23gi2erig97g1iuoielfr"
}
```

When logging in with mail & password, the system will store any failed login attemtps, when the
mail matched, but not the password.
