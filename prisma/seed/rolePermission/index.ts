export const rolePermissions = [
    {
        roleId: 3, //merchant
        permissionId: 1, //agent.create
    },
    {
        roleId: 3, //merchant
        permissionId: 2, //agent.create
    },
    {
        roleId: 3, //merchant
        permissionId: 3, //fund.agent
    },
    {
        roleId: 6, //sub agent
        permissionId: 4, //agent.create
    },
    {
        roleId: 6, //sub agent
        permissionId: 5, //agent.create
    },
    {
        roleId: 3, //merchant
        permissionId: 5, //"wallet.commission.transfer_to_main
    },
    {
        roleId: 3, //merchant
        permissionId: 6, //payout.request
    },
    {
        roleId: 1, //agent
        permissionId: 6, //payout.request
    },

    //

    {
        roleId: 3, //merchant
        permissionId: 7, ///bank_account.create
    },
    {
        roleId: 1, //agent
        permissionId: 7, //bank_account.create
    },

    //
    {
        roleId: 3, //merchant
        permissionId: 8, //bank_account.read
    },
    {
        roleId: 1, //agent
        permissionId: 8, ///bank_account.read
    },

    {
        roleId: 2, //admin
        permissionId: 3
    }
];
