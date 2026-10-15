"""replace_avatar_data_with_avatar_url

Profile pictures now come from the Google account (userinfo `picture`) instead of
base64 uploads stored in the row.

Revision ID: c7d1a2f0e9b4
Revises: 88d4ed8a107c
Create Date: 2026-10-15 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7d1a2f0e9b4'
down_revision: Union[str, None] = '88d4ed8a107c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'auth_user',
        sa.Column('avatar_url', sa.String(length=2048), nullable=True),
        schema='mynab',
    )
    op.drop_column('auth_user', 'avatar_data', schema='mynab')


def downgrade() -> None:
    # Dropped uploads cannot be restored; the column comes back empty
    op.add_column(
        'auth_user',
        sa.Column('avatar_data', sa.Text(), nullable=True),
        schema='mynab',
    )
    op.drop_column('auth_user', 'avatar_url', schema='mynab')
