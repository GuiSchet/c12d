{
  description = "c12d – Bitcoin Core P2P monitoring dashboard";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs_22
          ];

          shellHook = ''
            echo "c12d dev shell – node $(node --version), npm $(npm --version)"
          '';
        };
      }
    );
}
